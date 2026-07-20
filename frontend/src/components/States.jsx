export function Spinner({ label = "Loading" }) {
  return (
    <div className="flex items-center gap-2 text-ink-soft" role="status" aria-live="polite">
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
      </svg>
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-rust/30 bg-rust-soft px-4 py-3 text-sm text-rust">
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded border border-rust/40 px-2.5 py-1 text-xs font-medium hover:bg-rust/10"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="rounded-lg border border-dashed border-rule-strong bg-paper-raised px-6 py-14 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
