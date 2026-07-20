import { formatMoney } from "../lib/format.js";

// The one deliberate "signature" visual for the dashboard: rather than a
// generic donut, this reads like a ledger balance — a single strip of the
// total order value, split into what cleanly reconciled, what's disputed
// but low-stakes, and what's genuinely at risk. It's meant to answer "how
// bad is it" in one glance before anyone reads a single number.
export default function BalanceBar({ headline }) {
  const total = Math.max(headline.total_order_value, 1);
  const atRisk = headline.amount_at_risk;
  const disputedOther = Math.max(headline.total_value_in_dispute - atRisk, 0);
  const reconciled = Math.max(total - atRisk - disputedOther, 0);

  const segments = [
    { key: "reconciled", value: reconciled, color: "var(--color-teal)", label: "Reconciled" },
    { key: "disputed", value: disputedOther, color: "var(--color-ochre)", label: "Disputed, lower stakes" },
    { key: "atrisk", value: atRisk, color: "var(--color-rust)", label: "At risk" },
  ].filter((s) => s.value > 0);

  return (
    <div className="rounded-lg border border-rule bg-paper-raised p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-wide text-ink-faint">Order value, at a glance</p>
        <p className="font-tabular text-xs text-ink-faint">{formatMoney(total)} total</p>
      </div>

      <div className="flex h-5 w-full overflow-hidden rounded-full border border-rule-strong/60">
        {segments.map((s) => (
          <div
            key={s.key}
            style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
            title={`${s.label}: ${formatMoney(s.value)}`}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-ink-soft">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span>{s.label}</span>
            <span className="font-tabular text-ink-faint">{formatMoney(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
