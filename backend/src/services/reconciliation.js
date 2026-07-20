// The reconciliation engine.
//
// Deliberately pure/deterministic: given the same rows, it always
// produces the same discrepancies. No LLM calls happen in here - that's
// the whole point of keeping this file separate from services/llm.js.
//
// Rules implemented (see README for the full reasoning on each):
//   - AMOUNT_TOLERANCE: differences of a few cents are floating-point /
//     rounding noise, not real discrepancies.
//   - Matching key: order_id / order_reference, normalized (trim + upper).
//   - One order can have zero, one, or many payment rows against it
//     (duplicate charges, charge+refund pairs) - we look at the whole
//     group per order, not just a 1:1 pair.

export const AMOUNT_TOLERANCE = 0.05; // dollars; see README for why 5 cents

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function newDisc(batchId, type, {
  orderId = null, paymentRef = null, orderAmount = null, paymentAmount = null,
  amountAtRisk = 0, severity = "medium", details = "",
} = {}) {
  return {
    batchId,
    discrepancyType: type,
    orderId,
    paymentRef,
    orderAmount,
    paymentAmount,
    amountAtRisk: round2(amountAtRisk),
    severity,
    details,
  };
}

export function reconcile(batchId, orders, payments) {
  const paymentsByOrder = new Map();
  for (const p of payments) {
    const key = p.orderReferenceNormalized;
    if (!paymentsByOrder.has(key)) paymentsByOrder.set(key, []);
    paymentsByOrder.get(key).push(p);
  }

  const orderIdsSeen = new Set();
  const discrepancies = [];

  for (const order of orders) {
    const key = order.orderIdNormalized;
    orderIdsSeen.add(key);
    const plist = paymentsByOrder.get(key) || [];
    discrepancies.push(...reconcileOneOrder(batchId, order, plist));
  }

  // Orphan payments: money collected that references an order we have no
  // record of at all. This is revenue that exists in the payment
  // processor but is invisible to the store's own books - a real
  // accounting/compliance risk, separate from any specific order.
  for (const [ref, plist] of paymentsByOrder.entries()) {
    if (orderIdsSeen.has(ref) || ref === "") continue;
    for (const p of plist) {
      if (p.type === "refund") {
        discrepancies.push(newDisc(batchId, "orphan_payment", {
          paymentRef: p.transactionRef,
          paymentAmount: p.amount,
          amountAtRisk: 0,
          severity: "low",
          details: `Refund transaction ${p.transactionRef} references order '${p.orderReference}', which does not exist in the orders data.`,
        }));
      } else {
        discrepancies.push(newDisc(batchId, "orphan_payment", {
          paymentRef: p.transactionRef,
          paymentAmount: p.amount,
          amountAtRisk: p.amount || 0,
          severity: "medium",
          details: `Charge ${p.transactionRef} for ${p.amount} references order '${p.orderReference}', which does not exist in the orders data. Revenue collected but not recorded as a sale.`,
        }));
      }
    }
  }

  return discrepancies;
}

function reconcileOneOrder(batchId, order, plist) {
  const out = [];
  const charges = plist.filter((p) => p.type === "charge");
  const refunds = plist.filter((p) => p.type === "refund");
  const net = order.netAmount || 0;

  // 1. No payment at all.
  if (charges.length === 0 && refunds.length === 0) {
    out.push(newDisc(batchId, "missing_payment", {
      orderId: order.orderId, orderAmount: net, amountAtRisk: net, severity: "high",
      details: `Order ${order.orderId} is marked '${order.status}' but no payment of any kind was found for it. The store believes it sold ${net}, and no money has been collected.`,
    }));
    return out;
  }

  // 2. Duplicate charges: more than one 'charge' row for this order.
  //    (A charge + refund pair is handled separately below, not here.)
  if (charges.length > 1) {
    const amounts = new Set(charges.map((c) => round2(c.amount || 0)));
    if (amounts.size === 1) {
      const extra = charges.length - 1;
      out.push(newDisc(batchId, "duplicate_charge", {
        orderId: order.orderId,
        paymentRef: charges.map((c) => c.transactionRef).join(", "),
        orderAmount: net, paymentAmount: charges[0].amount,
        amountAtRisk: extra * (charges[0].amount || 0), severity: "high",
        details: `Order ${order.orderId} was charged ${charges.length} times for the same amount (${charges[0].amount}). Likely a double-submit; the customer is owed a refund for the extra charge(s).`,
      }));
    } else {
      const totalCharged = charges.reduce((s, c) => s + (c.amount || 0), 0);
      out.push(newDisc(batchId, "amount_mismatch", {
        orderId: order.orderId,
        paymentRef: charges.map((c) => c.transactionRef).join(", "),
        orderAmount: net, paymentAmount: totalCharged,
        amountAtRisk: Math.abs(net - totalCharged), severity: "medium",
        details: `Order ${order.orderId} has ${charges.length} charges totalling ${totalCharged}, against an order value of ${net}.`,
      }));
    }
    // A duplicated charge can still also have refund activity against it;
    // fall through to also check refunds below using the first charge.
  }

  const charge = charges[0] || null;

  // 3. Refund activity.
  if (refunds.length > 0) {
    const totalRefunded = refunds.reduce((s, r) => s + (r.amount || 0), 0);
    const chargeAmount = charge ? charge.amount : net;

    if (chargeAmount && totalRefunded >= chargeAmount - AMOUNT_TOLERANCE) {
      // Fully refunded. Not "money at risk" (it's resolved), but worth
      // surfacing - and worth flagging if the order's own status field
      // disagrees.
      const severity = order.status === "refunded" ? "low" : "medium";
      const note = order.status === "refunded" ? "" :
        ` Order status is '${order.status}', not 'refunded' - the order record wasn't updated.`;
      out.push(newDisc(batchId, "full_refund", {
        orderId: order.orderId,
        paymentRef: refunds.map((r) => r.transactionRef).join(", "),
        orderAmount: net, paymentAmount: totalRefunded,
        amountAtRisk: 0, severity,
        details: `Order ${order.orderId} was charged ${chargeAmount} and fully refunded (${totalRefunded}).${note}`,
      }));
    } else {
      // Partial refund: charged, then only part of it came back.
      // amountAtRisk = the gap between what's been refunded and what the
      // order status implies should have been refunded.
      const gap = chargeAmount - totalRefunded;
      let severity = "medium";
      let note = "";
      if (order.status === "refunded") {
        severity = "high";
        note = ` Order status says 'refunded' but only ${totalRefunded} of ${chargeAmount} has actually been returned - the customer may be expecting the rest.`;
      }
      out.push(newDisc(batchId, "partial_refund", {
        orderId: order.orderId,
        paymentRef: refunds.map((r) => r.transactionRef).join(", "),
        orderAmount: net, paymentAmount: totalRefunded,
        amountAtRisk: round2(gap), severity,
        details: `Order ${order.orderId} was charged ${chargeAmount} and partially refunded (${totalRefunded}).${note}`,
      }));
    }
    return out;
  }

  // 4. Exactly one charge, no refund - check its health.
  if (charge) {
    if (charge.status === "failed") {
      out.push(newDisc(batchId, "failed_payment", {
        orderId: order.orderId, paymentRef: charge.transactionRef,
        orderAmount: net, paymentAmount: charge.amount, amountAtRisk: net, severity: "high",
        details: `Order ${order.orderId} is marked '${order.status}' but its payment (${charge.transactionRef}) has status 'failed'. No money was actually collected.`,
      }));
      return out;
    }

    if (charge.status === "pending") {
      out.push(newDisc(batchId, "pending_payment", {
        orderId: order.orderId, paymentRef: charge.transactionRef,
        orderAmount: net, paymentAmount: charge.amount, amountAtRisk: net, severity: "medium",
        details: `Order ${order.orderId} is marked '${order.status}' but its payment (${charge.transactionRef}) is still 'pending' settlement.`,
      }));
      return out;
    }

    if (order.status === "cancelled") {
      out.push(newDisc(batchId, "cancelled_but_charged", {
        orderId: order.orderId, paymentRef: charge.transactionRef,
        orderAmount: net, paymentAmount: charge.amount, amountAtRisk: charge.amount || 0, severity: "high",
        details: `Order ${order.orderId} is marked 'cancelled' in the store, but a settled charge of ${charge.amount} exists for it and was never refunded.`,
      }));
      return out;
    }

    if (order.currency && charge.currency && order.currency !== charge.currency) {
      out.push(newDisc(batchId, "currency_mismatch", {
        orderId: order.orderId, paymentRef: charge.transactionRef,
        orderAmount: net, paymentAmount: charge.amount,
        amountAtRisk: Math.max(net, charge.amount || 0), severity: "high",
        details: `Order ${order.orderId} was recorded in ${order.currency}, but its payment was processed in ${charge.currency}. Amounts aren't directly comparable without a trusted FX rate, so this needs manual review.`,
      }));
      return out;
    }

    const diff = Math.abs(net - (charge.amount || 0));
    if (diff > AMOUNT_TOLERANCE) {
      out.push(newDisc(batchId, "amount_mismatch", {
        orderId: order.orderId, paymentRef: charge.transactionRef,
        orderAmount: net, paymentAmount: charge.amount, amountAtRisk: diff,
        severity: diff < 25 ? "medium" : "high",
        details: `Order ${order.orderId} has a net amount of ${net}, but its payment was ${charge.amount} - a difference of ${round2(diff)} with no discount or refund to explain it.`,
      }));
      return out;
    }

    // Clean match - no discrepancy for this order.
    return out;
  }

  return out;
}
