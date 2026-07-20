# Frontend

React (Vite) single-page app for the reconciliation dashboard. Talks to the
Express/MongoDB backend in `../backend` over its REST API.

## Stack

- React 19 + React Router (client-side auth-gated routing)
- Tailwind CSS v4 (CSS-first config — tokens live in `src/index.css`, no `tailwind.config.js`)
- Recharts for the discrepancy breakdown chart
- Axios for API calls, with a single interceptor that attaches the JWT and
  a single handler that logs the user out on any 401

## Run locally

```bash
npm install
cp .env.example .env   # set VITE_API_URL to your backend's URL
npm run dev
```

## Design

Deliberately styled as a **ledger / audit tool**, not a generic SaaS
dashboard — paper background, serif display type for headings, and
monospaced tabular figures for every number so amounts line up and are easy
to scan (the same reason real ledgers and spreadsheets use fixed-width
digits). Severity is color-coded consistently everywhere it appears (rust =
high, ochre = medium, slate = low) rather than a generic red/yellow/green,
because "high severity" here specifically means "likely real revenue loss,"
not just "urgent."

The one deliberately custom visual is the **balance bar** at the top of the
dashboard: a single horizontal strip of the batch's total order value,
split into reconciled / disputed-but-low-stakes / at-risk. It's meant to
answer "how bad is it" before the reader parses a single number — everything
else on the page (headline cards, the breakdown chart, the table) is there
to justify or drill into that one bar.

## Structure

```
src/
  api/            axios client + typed wrappers for each backend route
  context/        AuthContext — holds the JWT, exposes login/signup/logout
  components/     presentational + form pieces (table, filters, drawer, chart...)
  pages/          Login, Signup, Batches (upload + history), Dashboard
  lib/format.js   money/date formatting, discrepancy-type labels, severity styles
```

## How auth is enforced client-side

- The JWT lives in `localStorage` and is attached to every request via an
  axios interceptor — no component reaches into storage directly.
- `ProtectedRoute` redirects to `/login` if there's no token; `AuthRedirect`
  does the reverse for `/login` and `/signup` so a logged-in user can't
  land back on them.
- This is a UX convenience only, not the real security boundary — that's
  the backend's `requireAuth` middleware, which filters every query by the
  user id decoded from the JWT. The frontend never passes a user id to the
  API; it's always inferred server-side from the token.

## Data flow on the dashboard

1. `GET /batches/:id/dashboard` → headline figures + per-type breakdown
   (aggregated server-side, not computed client-side from raw rows).
2. `GET /batches/:id/discrepancies?discrepancy_type=&severity=&search=` →
   the drill-down table, refetched (debounced 250ms) whenever a filter
   changes. Clicking a bar in the breakdown chart sets the type filter.
3. `POST /batches/:id/explain` with 1–25 discrepancy ids → opens the
   right-hand drawer, which shows the deterministic rule explanation
   immediately (already in the row data) and the LLM's plain-language
   explanation once it resolves, with its own loading/error state that
   doesn't block the rest of the drawer.

## Loading & error states

Every network-backed screen has three states it actually renders:
loading (skeleton/spinner), error (message + retry button, via
`extractErrorMessage` which normalizes network errors, validation 422s, and
unexpected 500s into one string), and success. The LLM explain call is
scoped to its own loading/error UI inside the drawer so a slow or failed
explanation never blocks the discrepancy detail itself from showing.
