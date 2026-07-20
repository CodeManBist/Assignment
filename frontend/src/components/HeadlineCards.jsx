import { formatMoney } from "../lib/format.js";

function Card({ label, value, sub, tone }) {
  const toneClass = tone === "rust" ? "text-rust" : tone === "teal" ? "text-teal" : "text-ink";
  return (
    <div className="rounded-lg border border-rule bg-paper-raised p-4">
      <p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p>
      <p className={`mt-1.5 font-tabular text-2xl font-medium ${toneClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-faint">{sub}</p>}
    </div>
  );
}

export default function HeadlineCards({ headline }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Card label="Orders" value={headline.total_orders.toLocaleString()} sub={formatMoney(headline.total_order_value)} />
      <Card label="Payments" value={headline.total_payments.toLocaleString()} sub={formatMoney(headline.total_payment_value)} />
      <Card label="Reconciled" value={formatMoney(headline.total_value_reconciled)} tone="teal" sub="Matches cleanly" />
      <Card label="In dispute" value={formatMoney(headline.total_value_in_dispute)} sub={`${headline.discrepancy_count.toLocaleString()} discrepancies`} />
      <Card label="At risk" value={formatMoney(headline.amount_at_risk)} tone="rust" sub="High + medium severity" />
    </div>
  );
}
