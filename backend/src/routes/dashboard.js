import { Router } from "express";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Discrepancy from "../models/Discrepancy.js";
import { requireAuth } from "../middleware/auth.js";
import { getOwnedBatch } from "./batches.js";

const router = Router();
router.use(requireAuth);

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

router.get("/:batchId/dashboard", async (req, res) => {
  const batch = await getOwnedBatch(req.params.batchId, req.userId);
  if (!batch) return res.status(404).json({ detail: "Batch not found" });

  const [totalOrders, totalPayments, orderAgg, paymentAgg, discrepancies] = await Promise.all([
    Order.countDocuments({ batchId: batch._id }),
    Payment.countDocuments({ batchId: batch._id }),
    Order.aggregate([
      { $match: { batchId: batch._id } },
      { $group: { _id: null, total: { $sum: "$netAmount" } } },
    ]),
    Payment.aggregate([
      { $match: { batchId: batch._id, type: "charge" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Discrepancy.find({ batchId: batch._id }),
  ]);

  const totalOrderValue = orderAgg[0]?.total || 0;
  const totalPaymentValue = paymentAgg[0]?.total || 0;

  const totalValueInDispute = discrepancies.reduce((s, d) => s + d.amountAtRisk, 0);
  // "amount at risk" is the subset of disputed value that's a likely real
  // loss (high/medium severity) rather than purely informational entries
  // like a clean full_refund, which we still show but don't count as risk.
  const amountAtRisk = discrepancies
    .filter((d) => d.severity === "high" || d.severity === "medium")
    .reduce((s, d) => s + d.amountAtRisk, 0);

  const disputedOrderValue = discrepancies
    .filter((d) => d.orderId && d.discrepancyType !== "full_refund")
    .reduce((s, d) => s + (d.orderAmount || 0), 0);
  const totalValueReconciled = Math.max(totalOrderValue - disputedOrderValue, 0);

  const breakdownMap = new Map();
  for (const d of discrepancies) {
    const cur = breakdownMap.get(d.discrepancyType) || { count: 0, total: 0 };
    cur.count += 1;
    cur.total += d.amountAtRisk;
    breakdownMap.set(d.discrepancyType, cur);
  }
  const breakdown = [...breakdownMap.entries()].map(([discrepancy_type, v]) => ({
    discrepancy_type,
    count: v.count,
    total_amount_at_risk: round2(v.total),
  }));

  res.json({
    headline: {
      total_orders: totalOrders,
      total_payments: totalPayments,
      total_order_value: round2(totalOrderValue),
      total_payment_value: round2(totalPaymentValue),
      total_value_reconciled: round2(totalValueReconciled),
      total_value_in_dispute: round2(totalValueInDispute),
      amount_at_risk: round2(amountAtRisk),
      discrepancy_count: discrepancies.length,
    },
    breakdown,
  });
});

router.get("/:batchId/discrepancies", async (req, res) => {
  const batch = await getOwnedBatch(req.params.batchId, req.userId);
  if (!batch) return res.status(404).json({ detail: "Batch not found" });

  const { discrepancy_type, severity, search } = req.query;
  const filter = { batchId: batch._id };
  if (discrepancy_type) filter.discrepancyType = discrepancy_type;
  if (severity) filter.severity = severity;
  if (search) {
    const re = new RegExp(search, "i");
    filter.$or = [{ orderId: re }, { paymentRef: re }];
  }

  const rows = await Discrepancy.find(filter).sort({ amountAtRisk: -1 });
  res.json(
    rows.map((d) => ({
      id: d._id,
      discrepancy_type: d.discrepancyType,
      order_id: d.orderId,
      payment_ref: d.paymentRef,
      order_amount: d.orderAmount,
      payment_amount: d.paymentAmount,
      amount_at_risk: d.amountAtRisk,
      severity: d.severity,
      details: d.details,
      created_at: d.createdAt,
    }))
  );
});

export default router;
