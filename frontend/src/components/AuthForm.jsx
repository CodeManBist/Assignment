import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { extractErrorMessage } from "../api/client.js";
import { ErrorBanner, Spinner } from "./States.jsx";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isSignup) await signup(email, password);
      else await login(email, password);
      navigate("/");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-57px)] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <p className="font-display text-2xl text-ink">{isSignup ? "Create an account" : "Welcome back"}</p>
        <p className="mt-1.5 text-sm text-ink-soft">
          {isSignup
            ? "Set up access to reconcile your orders and payments."
            : "Log in to see your reconciliation batches."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-rule bg-paper-raised p-6 shadow-sm">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-rule-strong bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-teal"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-rule-strong bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-teal"
            placeholder="At least 8 characters"
          />
        </div>

        <ErrorBanner message={error} />

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/90 disabled:opacity-60"
        >
          {submitting ? <Spinner label={isSignup ? "Creating account…" : "Logging in…"} /> : isSignup ? "Create account" : "Log in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-soft">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-teal hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link to="/signup" className="font-medium text-teal hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
