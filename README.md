# Assignment — Personal Task & Media Vault

Live App: https://assignment-smoky-iota.vercel.app/

A full-stack task management app with image attachments, built with **Next.js (App Router)**, **Supabase**, and **Tailwind CSS**.

## Features

- **Authentication** — Email/password signup & login via Supabase Auth
- **Task CRUD** — Create, read, update, and delete tasks
- **Image Uploads** — Attach images (JPEG/PNG/GIF/WebP, 5 MB max) via Supabase Storage
- **Status Toggle** — Mark tasks as pending or completed
- **Filtering** — Filter dashboard by All / Pending / Completed
- **Route Protection** — Middleware redirects unauthenticated users to login
- **Row Level Security (RLS)** — Queries are scoped to the authenticated user

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router, Server Actions) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Storage | Supabase Storage |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Notifications | React Hot Toast |

## Project Structure

```
src/
├── app/
│   ├── auth/callback/route.ts
│   ├── dashboard/
│   │   ├── actions.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── dashboard-nav.tsx
│   ├── task-card.tsx
│   ├── task-list.tsx
│   └── task-modal.tsx
├── lib/supabase/
│   ├── client.ts
│   ├── middleware.ts
│   └── server.ts
├── types/
│   └── task.ts
└── middleware.ts
```

## Getting Started

### 1) Clone & Install

```bash
git clone <your-repo-url>
cd task-vault
npm install
```

### 2) Supabase Setup

1. Create a project at https://supabase.com
2. In **SQL Editor**, run `supabase/schema.sql` to create the `tasks` table, RLS policies, and the storage bucket.
3. Copy your project URL and anon key from **Settings → API**.

### 3) Environment Variables

```bash
cp .env.example .env.local
```

Set:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4) Run Locally

```bash
npm run dev
```

Open http://localhost:3000

## Database Schema

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key, auto-generated |
| `created_at` | `timestamptz` | Defaults to `now()` |
| `title` | `text` | Required |
| `description` | `text` | Defaults to `''` |
| `status` | `text` | `'pending'` or `'completed'` |
| `user_id` | `uuid` | FK → `auth.users`, cascading delete |
| `image_url` | `text` | Nullable, public URL from Supabase Storage |

**RLS Policies:** Each user can only SELECT, INSERT, UPDATE, and DELETE their own rows.

## Design Decisions

- **Server Actions over API Routes** — Keeps data mutations close to the UI and works with `revalidatePath`.
- **Server-side data fetching** — Dashboard page fetches tasks on the server.
- **Middleware auth guard** — Protects all `/dashboard/*` routes.
- **Image cleanup on delete** — Deletes storage objects when a task is removed.
