import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getDashboard, getDiscrepancies } from "../api/reconciliation.js";
import { extractErrorMessage } from "../api/client.js";
import HeadlineCards from "../components/HeadlineCards.jsx";
import BalanceBar from "../components/BalanceBar.jsx";
import BreakdownChart from "../components/BreakdownChart.jsx";
import DiscrepancyFilters from "../components/DiscrepancyFilters.jsx";
import DiscrepancyTable from "../components/DiscrepancyTable.jsx";
import DiscrepancyDrawer from "../components/DiscrepancyDrawer.jsx";
import { Spinner, ErrorBanner } from "../components/States.jsx";

export default function Dashboard() {
  const { batchId } = useParams();

  const [dashboard, setDashboard] = useState(null);
  const [dashboardError, setDashboardError] = useState("");

  const [filters, setFilters] = useState({ search: "", discrepancy_type: "", severity: "" });
  const [rows, setRows] = useState(null);
  const [rowsError, setRowsError] = useState("");

  const [drawerRows, setDrawerRows] = useState(null);

  const loadDashboard = useCallback(() => {
    setDashboardError("");
    getDashboard(batchId)
      .then(setDashboard)
      .catch((err) => setDashboardError(extractErrorMessage(err)));
  }, [batchId]);

  useEffect(loadDashboard, [loadDashboard]);

  // Debounce filter/search changes before hitting the API so typing in
  // the search box doesn't fire a request per keystroke.
  const debounceRef = useRef(null);
  const loadRows = useCallback(() => {
    setRowsError("");
    getDiscrepancies(batchId, filters)
      .then(setRows)
      .catch((err) => setRowsError(extractErrorMessage(err)));
  }, [batchId, filters]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(loadRows, 250);
    return () => clearTimeout(debounceRef.current);
  }, [loadRows]);

  if (dashboardError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorBanner message={dashboardError} onRetry={loadDashboard} />
        <Link to="/" className="mt-4 inline-block text-sm text-teal hover:underline">
          ← Back to batches
        </Link>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Spinner label="Loading dashboard…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/" className="text-xs text-teal hover:underline">
            ← All batches
          </Link>
          <p className="mt-1 font-display text-2xl text-ink">Reconciliation dashboard</p>
        </div>
      </div>

      <HeadlineCards headline={dashboard.headline} />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <BalanceBar headline={dashboard.headline} />
        <BreakdownChart
          breakdown={dashboard.breakdown}
          discrepancyRows={rows || []}
          onSelectType={(type) => setFilters((f) => ({ ...f, discrepancy_type: type }))}
        />
      </div>

      <div className="mt-4 rounded-lg border border-rule bg-paper-raised">
        <DiscrepancyFilters
          filters={filters}
          onChange={setFilters}
          resultCount={rows ? rows.length : 0}
          bulkDisabled={!rows || rows.length === 0 || rows.length > 25}
          onBulkExplain={() => setDrawerRows(rows)}
        />

        {rowsError && (
          <div className="p-4">
            <ErrorBanner message={rowsError} onRetry={loadRows} />
          </div>
        )}
        {!rowsError && rows === null && (
          <div className="p-4">
            <Spinner label="Loading discrepancies…" />
          </div>
        )}
        {!rowsError && rows !== null && (
          <DiscrepancyTable rows={rows} onSelect={(row) => setDrawerRows([row])} />
        )}
      </div>

      <DiscrepancyDrawer rows={drawerRows} batchId={batchId} onClose={() => setDrawerRows(null)} />
    </div>
  );
}
