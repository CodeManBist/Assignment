export function formatMoney(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const DISCREPANCY_LABELS = {
  missing_payment: "Missing payment",
  duplicate_charge: "Duplicate charge",
  amount_mismatch: "Amount mismatch",
  full_refund: "Full refund",
  partial_refund: "Partial refund",
  failed_payment: "Failed payment",
  pending_payment: "Pending settlement",
  cancelled_but_charged: "Cancelled but charged",
  currency_mismatch: "Currency mismatch",
  orphan_payment: "Orphan payment",
};

export function discrepancyLabel(type) {
  return DISCREPANCY_LABELS[type] || type;
}

export const SEVERITY_STYLES = {
  high: { fg: "text-rust", bg: "bg-rust-soft", label: "High" },
  medium: { fg: "text-ochre", bg: "bg-ochre-soft", label: "Medium" },
  low: { fg: "text-slate", bg: "bg-slate-soft", label: "Low" },
};
