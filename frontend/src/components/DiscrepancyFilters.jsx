import { DISCREPANCY_LABELS } from "../lib/format.js";

export default function DiscrepancyFilters({ filters, onChange, resultCount, onBulkExplain, bulkDisabled }) {
  return (
    <div className="flex flex-col gap-3 border-b border-rule p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search order or payment ref…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full rounded-md border border-rule-strong bg-paper px-3 py-1.5 text-sm outline-none focus:border-teal sm:w-56"
        />
        <select
          value={filters.discrepancy_type}
          onChange={(e) => onChange({ ...filters, discrepancy_type: e.target.value })}
          className="rounded-md border border-rule-strong bg-paper px-3 py-1.5 text-sm outline-none focus:border-teal"
        >
          <option value="">All types</option>
          {Object.entries(DISCREPANCY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filters.severity}
          onChange={(e) => onChange({ ...filters, severity: e.target.value })}
          className="rounded-md border border-rule-strong bg-paper px-3 py-1.5 text-sm outline-none focus:border-teal"
        >
          <option value="">All severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {(filters.search || filters.discrepancy_type || filters.severity) && (
          <button
            onClick={() => onChange({ search: "", discrepancy_type: "", severity: "" })}
            className="text-xs font-medium text-teal hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="font-tabular text-xs text-ink-faint">{resultCount} row{resultCount === 1 ? "" : "s"}</span>
        <button
          onClick={onBulkExplain}
          disabled={bulkDisabled}
          title={bulkDisabled ? "Filter down to 25 or fewer rows to explain them as a set" : "Ask the assistant to explain everything currently shown"}
          className="rounded-md border border-teal px-3 py-1.5 text-xs font-medium text-teal transition hover:bg-teal-soft disabled:cursor-not-allowed disabled:border-rule-strong disabled:text-ink-faint"
        >
          Explain these ({resultCount})
        </button>
      </div>
    </div>
  );
}
