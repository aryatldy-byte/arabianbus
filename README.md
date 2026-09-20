# Bus Service App

Mobile-friendly Next.js + Supabase app for a 2-bus service company: staff log
daily collections and expenses; the owner (admin) views a filterable
dashboard with totals.

## Tech Stack
- **Frontend:** Next.js (Pages Router) + TailwindCSS
- **Backend:** Supabase (Auth + Postgres, with Row Level Security)
- **Deployment:** Vercel

## Project Structure
```
bus-service-app/
├── components/
│   ├── LoginForm.js        # Email/password sign-in form
│   ├── CollectionForm.js   # Staff: log daily ticket collection
│   ├── ExpenseForm.js      # Staff: log daily expense
│   ├── AdminDashboard.js   # Admin: filters + totals + tables
│   ├── BusFilterBar.js     # Date range + bus filter controls
│   ├── Navbar.js           # Top bar with logout
│   └── ProtectedRoute.js   # Auth/role route guard
├── contexts/
│   └── AuthContext.js      # Session + role state, available via useAuth()
├── lib/
│   ├── supabaseClient.js   # Supabase client singleton
│   └── constants.js        # Bus numbers + expense categories
├── pages/
│   ├── index.js            # Redirects based on auth/role
│   ├── login.js
│   ├── staff.js            # Staff dashboard (forms)
│   └── admin.js            # Admin dashboard
├── supabase/
│   ├── schema.sql          # Tables + RLS policies + auth trigger
│   └── seed.sql            # Example test data
└── styles/globals.css
```

## 1. Supabase Setup
1. Create a project at https://supabase.com.
2. Go to **SQL Editor** and run `supabase/schema.sql`. This creates:
   - `public.users` (id, email, role)
   - `public.collections` (id, bus_number, date, amount, staff_id)
   - `public.expenses` (id, bus_number, date, expense_type, amount, staff_id)
   - A trigger that auto-creates a `public.users` row (role defaults to `staff`)
     whenever someone signs up via Supabase Auth.
   - RLS policies so staff only see their own entries, and admins see everything.
3. Create test accounts under **Authentication → Users → Add user**:
   - `owner@busco.test` (this will become your admin)
   - `driver1@busco.test`, `driver2@busco.test` (stay as staff)
4. Promote the owner account:
   ```sql
   update public.users set role = 'admin' where email = 'owner@busco.test';
   ```
5. (Optional) Run `supabase/seed.sql` to insert ~10 sample collection and
   expense rows across both buses for the last 5 days, so the admin
   dashboard has data to show immediately.

## 2. Local Development
`.env.local` is already filled in with this project's Supabase URL + anon key,
so you can skip straight to installing and running:
```bash
npm install
npm run dev
```
Visit http://localhost:3000 — you'll be redirected to `/login`.

(`.env.local.example` is kept as a template only — `.env.local` itself is
git-ignored, so it won't be pushed to GitHub. That's expected: you'll add the
same two values again directly in Vercel in the next step.)

## 3. Deploy to Vercel
1. Push this project to a GitHub repo (`.env.local` won't come along — that's fine).
2. In Vercel: **New Project → Import** the repo.
3. Add these two environment variables under **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://cnaeafvnkpaodujiajpq.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (the anon public key — same value as in `.env.local`)
4. Deploy. Vercel auto-detects Next.js — no extra build config needed.

## How Roles Work
- Every Supabase Auth user gets a matching row in `public.users` (role
  defaults to `staff` via a database trigger).
- After login, `AuthContext` looks up that row and exposes `role` app-wide.
- `ProtectedRoute` redirects: no session → `/login`; wrong role → the
  user's correct home page (`/staff` or `/admin`).
- Data access is enforced twice — once in the UI (route guard) and once at
  the database layer (RLS policies) — so a staff member can never read or
  write another bus's/employee's data even by calling the API directly.

## Adding More Buses
Edit `lib/constants.js` → `BUS_NUMBERS` array. No schema change needed since
`bus_number` is a free-text column.

## Editing / Deleting Entries
Staff can edit or delete their own collection/expense entries directly from
`/staff` (each form has a "My Recent Collections"/"My Recent Expenses" list
below it with Edit and Delete on every row). This is enforced at the database
level too — RLS policies only allow a user to update/delete rows where they
are the original `staff_id`, so one staff member can never alter another's
entries, even by calling the API directly. Admins currently have read-only
access to everything (by design, to preserve an audit trail) — they cannot
edit or delete staff entries from the dashboard.

If you set up your database **before** this feature was added, run
`supabase/migration_edit_delete.sql` once in the SQL Editor to add the
required columns and policies. Fresh installs already have this in
`schema.sql`, so a new project doesn't need the migration file.

## Notes / Possible Extensions
- Add a `users` management page for admins to promote/demote staff roles.
- Add CSV/PDF export for the admin dashboard's filtered results.
- Add monthly summary charts (e.g. with `recharts`).
- Let admins edit/delete any entry too, or restrict staff edits to a time window (e.g. same day only).
