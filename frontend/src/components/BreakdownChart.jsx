import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { discrepancyLabel, formatMoney } from "../lib/format.js";

const SEVERITY_COLOR = {
  high: "#a6421b",
  medium: "#93691f",
  low: "#3e5670",
};

// Colors the bar by whichever severity dominates that discrepancy type's
// count, so the chart doubles as a severity signal, not just a tally.
function dominantSeverity(rows) {
  const counts = { high: 0, medium: 0, low: 0 };
  for (const r of rows) counts[r.severity] = (counts[r.severity] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-rule bg-paper-raised px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-ink">{d.label}</p>
      <p className="mt-1 font-tabular text-ink-soft">{d.count} discrepancies</p>
      <p className="font-tabular text-ink-soft">{formatMoney(d.total_amount_at_risk)} at risk</p>
    </div>
  );
}

export default function BreakdownChart({ breakdown, discrepancyRows, onSelectType }) {
  const data = [...breakdown]
    .sort((a, b) => b.total_amount_at_risk - a.total_amount_at_risk)
    .map((b) => ({
      ...b,
      label: discrepancyLabel(b.discrepancy_type),
      severity: dominantSeverity(discrepancyRows.filter((r) => r.discrepancy_type === b.discrepancy_type)),
    }));

  if (data.length === 0) return null;

  return (
    <div className="rounded-lg border border-rule bg-paper-raised p-5">
      <p className="mb-1 text-xs uppercase tracking-wide text-ink-faint">Discrepancies by type</p>
      <p className="mb-4 text-sm text-ink-soft">Bar length is amount at risk. Click a bar to filter the table below.</p>
      <ResponsiveContainer width="100%" height={Math.max(data.length * 42, 120)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <XAxis type="number" tickFormatter={(v) => formatMoney(v)} tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }} axisLine={{ stroke: "var(--color-rule-strong)" }} tickLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={140}
            tick={{ fontSize: 12, fill: "var(--color-ink)" }}
            axisLine={{ stroke: "var(--color-rule-strong)" }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-rule)", opacity: 0.4 }} />
          <Bar
            dataKey="total_amount_at_risk"
            radius={[0, 3, 3, 0]}
            cursor="pointer"
            onClick={(d) => onSelectType(d.discrepancy_type)}
          >
            {data.map((d) => (
              <Cell key={d.discrepancy_type} fill={SEVERITY_COLOR[d.severity]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
