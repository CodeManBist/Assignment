import { useState, useRef } from "react";
import { extractErrorMessage } from "../api/client.js";
import { uploadBatch } from "../api/reconciliation.js";
import { ErrorBanner, Spinner } from "./States.jsx";

function FileDropField({ label, hint, file, onChange, accept = ".csv" }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  function handleFiles(files) {
    if (files && files[0]) onChange(files[0]);
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        role="button"
        tabIndex={0}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed px-4 py-8 text-center transition ${
          dragOver ? "border-teal bg-teal-soft" : file ? "border-teal/60 bg-teal-soft/40" : "border-rule-strong bg-paper hover:border-ink-faint"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {file ? (
          <>
            <span className="font-tabular text-sm text-teal">{file.name}</span>
            <span className="text-xs text-ink-faint">{(file.size / 1024).toFixed(1)} KB — click to replace</span>
          </>
        ) : (
          <>
            <span className="text-sm text-ink-soft">Drop {hint} here, or click to browse</span>
            <span className="text-xs text-ink-faint">.csv files only</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function UploadForm({ onUploaded }) {
  const [ordersFile, setOrdersFile] = useState(null);
  const [paymentsFile, setPaymentsFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ordersFile || !paymentsFile) {
      setError("Both files are required.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const batch = await uploadBatch(ordersFile, paymentsFile);
      setOrdersFile(null);
      setPaymentsFile(null);
      onUploaded(batch);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-rule bg-paper-raised p-5 shadow-sm">
      <p className="font-display text-lg text-ink">Reconcile a new batch</p>
      <p className="mt-1 text-sm text-ink-soft">
        Upload your orders export and your payments export. We'll match them and build a dashboard.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FileDropField label="Orders CSV" hint="orders.csv" file={ordersFile} onChange={setOrdersFile} />
        <FileDropField label="Payments CSV" hint="payments.csv" file={paymentsFile} onChange={setPaymentsFile} />
      </div>

      <div className="mt-4">
        <ErrorBanner message={error} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 flex items-center justify-center gap-2 rounded-md bg-teal px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-teal/90 disabled:opacity-60"
      >
        {submitting ? <Spinner label="Reconciling…" /> : "Upload & reconcile"}
      </button>
    </form>
  );
}
