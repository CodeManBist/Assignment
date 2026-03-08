# Personal Task & Media Vault

A full-stack task management app with image attachments, built with **Next.js 16**, **Supabase**, and **Tailwind CSS**.

## Features

- **Authentication** — Email/password signup & login via Supabase Auth
- **Task CRUD** — Create, read, update, and delete tasks with server actions
- **Image Uploads** — Attach images (JPEG/PNG/GIF/WebP, 5 MB max) to tasks via Supabase Storage
- **Status Toggle** — Mark tasks as pending or completed with one click
- **Filtering** — Filter dashboard by All / Pending / Completed
- **Route Protection** — Middleware redirects unauthenticated users to login
- **Row Level Security** — Every database query is scoped to the authenticated user

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Server Actions) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Storage | Supabase Storage |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Notifications | React Hot Toast |

## Project Structure

```
src/
├── app/
│   ├── auth/callback/route.ts   # Email verification handler
│   ├── dashboard/
│   │   ├── actions.ts           # Server actions (CRUD + upload)
│   │   ├── layout.tsx           # Protected layout (auth check)
│   │   └── page.tsx             # Dashboard page (server component)
│   ├── login/page.tsx           # Login page
│   ├── signup/page.tsx          # Signup page
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/
│   ├── dashboard-nav.tsx        # Top navigation bar
│   ├── task-card.tsx            # Individual task card
│   ├── task-list.tsx            # Filterable task grid + toolbar
│   └── task-modal.tsx           # Create / Edit modal with image upload
├── lib/supabase/
│   ├── client.ts                # Browser Supabase client
│   ├── middleware.ts            # Auth session refresh + route guards
│   └── server.ts                # Server Supabase client
├── types/
│   └── task.ts                  # Task, TaskInsert, TaskUpdate types
└── middleware.ts                # Next.js middleware entry point
```

## Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd task-vault
npm install
```

### 2. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql) — this creates the `tasks` table, RLS policies, and the `task-attachments` storage bucket
3. Copy your project URL and anon key from **Settings → API**

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

- **Server Actions over API Routes** — Keeps data mutations co-located with the UI, eliminates manual fetch calls, and works seamlessly with `revalidatePath` for cache invalidation.
- **Server-side data fetching** — The dashboard page fetches tasks on the server, reducing client JS and enabling instant rendering.
- **Middleware auth guard** — A single middleware file protects all `/dashboard/*` routes without repeating auth checks in every page.
- **Image cleanup on delete** — When a task is deleted, its associated storage object is also removed to prevent orphaned files.
