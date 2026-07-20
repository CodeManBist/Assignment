import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function NavBar() {
  const { isAuthenticated, email, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-rule bg-paper-raised">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-ink bg-ink font-display text-sm text-paper">
            L
          </span>
          <span className="font-display text-lg tracking-tight text-ink">Ledger</span>
        </Link>

        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <span className="hidden font-tabular text-xs text-ink-faint sm:inline">{email}</span>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="rounded border border-rule-strong px-3 py-1.5 text-sm text-ink-soft transition hover:border-ink hover:text-ink"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
