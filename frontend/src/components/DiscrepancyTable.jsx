import SeverityBadge from "./SeverityBadge.jsx";
import { discrepancyLabel, formatMoney } from "../lib/format.js";

export default function DiscrepancyTable({ rows, onSelect }) {
  if (rows.length === 0) {
    return (
      <div className="px-4 py-14 text-center">
        <p className="text-sm text-ink-soft">No discrepancies match these filters.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop / tablet: real table */}
      <table className="hidden w-full text-sm sm:table">
        <thead>
          <tr className="border-b border-rule text-left text-xs uppercase tracking-wide text-ink-faint">
            <th className="px-4 py-2.5 font-medium">Type</th>
            <th className="px-4 py-2.5 font-medium">Order</th>
            <th className="px-4 py-2.5 font-medium">Payment ref</th>
            <th className="px-4 py-2.5 text-right font-medium">Order amt</th>
            <th className="px-4 py-2.5 text-right font-medium">Payment amt</th>
            <th className="px-4 py-2.5 text-right font-medium">At risk</th>
            <th className="px-4 py-2.5 font-medium">Severity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => onSelect(r)}
              className="cursor-pointer border-b border-rule/60 transition hover:bg-paper"
            >
              <td className="px-4 py-2.5 text-ink">{discrepancyLabel(r.discrepancy_type)}</td>
              <td className="px-4 py-2.5 font-tabular text-ink-soft">{r.order_id || "—"}</td>
              <td className="px-4 py-2.5 font-tabular text-ink-soft">{r.payment_ref || "—"}</td>
              <td className="px-4 py-2.5 text-right font-tabular text-ink-soft">{formatMoney(r.order_amount)}</td>
              <td className="px-4 py-2.5 text-right font-tabular text-ink-soft">{formatMoney(r.payment_amount)}</td>
              <td className="px-4 py-2.5 text-right font-tabular font-medium text-ink">{formatMoney(r.amount_at_risk)}</td>
              <td className="px-4 py-2.5">
                <SeverityBadge severity={r.severity} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: stacked cards */}
      <ul className="divide-y divide-rule sm:hidden">
        {rows.map((r) => (
          <li key={r.id}>
            <button onClick={() => onSelect(r)} className="flex w-full flex-col gap-1.5 px-4 py-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">{discrepancyLabel(r.discrepancy_type)}</span>
                <SeverityBadge severity={r.severity} />
              </div>
              <div className="flex items-center justify-between font-tabular text-xs text-ink-faint">
                <span>{r.order_id || r.payment_ref || "—"}</span>
                <span className="font-medium text-ink">{formatMoney(r.amount_at_risk)} at risk</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
