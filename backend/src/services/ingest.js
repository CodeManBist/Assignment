import { parse } from "csv-parse/sync";

// Turns raw uploaded CSV text into plain objects shaped like the Order /
// Payment models. Kept separate from reconciliation.js: ingestion is
// "can we read this file at all" (parsing dates, numbers, encodings),
// reconciliation is "what do these rows tell us about the business".
// Mixing them makes both harder to reason about and test in isolation.

// Order references are identifiers, not free text - case and whitespace
// carry no business meaning. Without this, 'ord-1801 ' (a real value in
// the sample data) would never match 'ORD-1801' and would show up as a
// fake missing-payment discrepancy.
export function normalizeRef(value) {
  return (value || "").trim().toUpperCase();
}

// orders.csv uses ISO-ish "YYYY-MM-DD HH:MM:SS"
function parseOrderDate(raw) {
  const v = (raw || "").trim();
  if (!v) return null;
  return new Date(v.replace(" ", "T") + "Z");
}

// payments.csv uses "DD/MM/YYYY HH:MM" - day-first. This is a real
// gotcha: parsing it with `new Date(raw)` (month-first in JS) would
// silently misdate every payment where day <= 12, without ever erroring.
function parsePaymentDate(raw) {
  const v = (raw || "").trim();
  if (!v) return null;
  const [datePart, timePart] = v.split(" ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hour, minute] = (timePart || "00:00").split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

function parseFloatOrNull(raw) {
  const v = (raw || "").trim();
  if (v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function parseOrdersCsv(text, batchId) {
  const records = parse(text, { columns: true, skip_empty_lines: true, bom: true });

  const rows = [];
  const seenExact = new Set();
  for (const raw of records) {
    // Dedupe exact-duplicate rows (same order_id, same everything). The
    // sample data has ORD-1004 repeated verbatim - a data-export glitch,
    // not two separate orders - so counting it twice would inflate
    // revenue for no real reason.
    const key = JSON.stringify(raw);
    if (seenExact.has(key)) continue;
    seenExact.add(key);

    const orderId = (raw.order_id || "").trim();
    rows.push({
      batchId,
      orderId,
      orderIdNormalized: normalizeRef(orderId),
      orderDate: parseOrderDate(raw.order_date),
      customerEmail: (raw.customer_email || "").trim() || null,
      currency: (raw.currency || "").trim() || null,
      grossAmount: parseFloatOrNull(raw.gross_amount),
      discount: parseFloatOrNull(raw.discount),
      netAmount: parseFloatOrNull(raw.net_amount),
      status: (raw.status || "").trim().toLowerCase() || null,
    });
  }
  return rows;
}

export function parsePaymentsCsv(text, batchId) {
  const records = parse(text, { columns: true, skip_empty_lines: true, bom: true });

  return records.map((raw) => {
    const orderRef = (raw.order_reference || "").trim();
    return {
      batchId,
      transactionRef: (raw.transaction_ref || "").trim(),
      processedAt: parsePaymentDate(raw.processed_at),
      orderReference: orderRef,
      orderReferenceNormalized: normalizeRef(orderRef),
      currency: (raw.currency || "").trim() || null,
      amount: parseFloatOrNull(raw.amount),
      fee: parseFloatOrNull(raw.fee),
      netSettled: parseFloatOrNull(raw.net_settled),
      type: (raw.type || "").trim().toLowerCase() || null,
      status: (raw.status || "").trim().toLowerCase() || null,
    };
  });
}
