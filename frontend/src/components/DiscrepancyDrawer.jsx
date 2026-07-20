import { useEffect, useState } from "react";
import SeverityBadge from "./SeverityBadge.jsx";
import { Spinner, ErrorBanner } from "./States.jsx";
import { discrepancyLabel, formatMoney } from "../lib/format.js";
import { explainDiscrepancies } from "../api/reconciliation.js";
import { extractErrorMessage } from "../api/client.js";

function DiscrepancyDetail({ row, explanation, loading, error }) {
  return (
    <div className="border-b border-rule pb-5 last:border-b-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{discrepancyLabel(row.discrepancy_type)}</p>
          <p className="mt-0.5 font-tabular text-xs text-ink-faint">
            {row.order_id && <>Order {row.order_id} </>}
            {row.payment_ref && <>· Payment {row.payment_ref}</>}
          </p>
        </div>
        <SeverityBadge severity={row.severity} />
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-3 text-xs">
        <div>
          <dt className="text-ink-faint">Order amount</dt>
          <dd className="font-tabular text-ink">{formatMoney(row.order_amount)}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">Payment amount</dt>
          <dd className="font-tabular text-ink">{formatMoney(row.payment_amount)}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">At risk</dt>
          <dd className="font-tabular font-medium text-ink">{formatMoney(row.amount_at_risk)}</dd>
        </div>
      </dl>

      <p className="mt-3 rounded-md bg-paper px-3 py-2 text-xs text-ink-soft">
        <span className="font-medium text-ink-faint">Rule engine: </span>
        {row.details}
      </p>

      <div className="mt-3">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint">Plain-language explanation</p>
        {loading && <Spinner label="Asking the assistant…" />}
        {error && <ErrorBanner message={error} />}
        {explanation && !loading && !error && (
          <div className="space-y-1.5 text-sm text-ink">
            <p>{explanation.summary}</p>
            {explanation.likely_cause && <p className="text-ink-soft">Likely cause: {explanation.likely_cause}</p>}
            <p className="font-medium text-teal">→ {explanation.recommended_action}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DiscrepancyDrawer({ rows, batchId, onClose }) {
  // rows is always an array — length 1 for a single-row click, more for
  // the bulk "Explain these" action.
  const [explanations, setExplanations] = useState({});
  const [loadingIds, setLoadingIds] = useState(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    if (!rows || rows.length === 0) return;
    let cancelled = false;
    setError("");
    setLoadingIds(new Set(rows.map((r) => r.id)));

    explainDiscrepancies(
      batchId,
      rows.map((r) => r.id)
    )
      .then((results) => {
        if (cancelled) return;
        const byId = Object.fromEntries(results.map((e) => [e.discrepancy_id, e]));
        setExplanations(byId);
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingIds(new Set());
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, batchId]);

  if (!rows || rows.length === 0) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink/30" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-rule bg-paper-raised shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-rule px-5 py-4">
          <p className="font-display text-lg text-ink">
            {rows.length === 1 ? "Discrepancy detail" : `${rows.length} discrepancies`}
          </p>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-ink-soft hover:bg-paper hover:text-ink">
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-5 px-5 py-4">
          {error && <ErrorBanner message={error} onRetry={() => setError("")} />}
          {rows.map((row) => (
            <DiscrepancyDetail
              key={row.id}
              row={row}
              explanation={explanations[row.id]}
              loading={loadingIds.has(row.id) && !error}
              error={""}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
