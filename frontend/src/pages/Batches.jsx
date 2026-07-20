import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { listBatches } from "../api/reconciliation.js";
import { extractErrorMessage } from "../api/client.js";
import UploadForm from "../components/UploadForm.jsx";
import { ErrorBanner, Spinner, EmptyState } from "../components/States.jsx";
import { formatDate } from "../lib/format.js";

const STATUS_STYLES = {
  reconciled: "bg-teal-soft text-teal",
  processing: "bg-slate-soft text-slate",
  failed: "bg-rust-soft text-rust",
};

export default function Batches() {
  const [batches, setBatches] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    listBatches()
      .then(setBatches)
      .catch((err) => setError(extractErrorMessage(err)));
  }, []);

  useEffect(load, [load]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="font-display text-2xl text-ink">Your batches</p>
        <p className="mt-1 text-sm text-ink-soft">Each upload is reconciled independently, so you can compare runs over time.</p>
      </div>

      <UploadForm onUploaded={load} />

      <div className="mt-8">
        {error && <ErrorBanner message={error} onRetry={load} />}

        {!error && batches === null && <Spinner label="Loading batches…" />}

        {batches && batches.length === 0 && (
          <EmptyState
            title="No batches yet"
            body="Upload an orders file and a payments file above to run your first reconciliation."
          />
        )}

        {batches && batches.length > 0 && (
          <ul className="divide-y divide-rule overflow-hidden rounded-lg border border-rule bg-paper-raised">
            {batches.map((b) => (
              <li key={b.id}>
                <Link
                  to={b.status === "reconciled" ? `/batches/${b.id}` : "#"}
                  className={`flex flex-col gap-2 px-5 py-4 transition sm:flex-row sm:items-center sm:justify-between ${
                    b.status === "reconciled" ? "hover:bg-paper" : "cursor-default opacity-70"
                  }`}
                  aria-disabled={b.status !== "reconciled"}
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {b.orders_filename} <span className="text-ink-faint">+</span> {b.payments_filename}
                    </p>
                    <p className="mt-0.5 font-tabular text-xs text-ink-faint">{formatDate(b.created_at)}</p>
                  </div>
                  <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[b.status] || ""}`}>
                    {b.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
