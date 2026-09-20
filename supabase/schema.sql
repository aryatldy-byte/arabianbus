-- ============================================================================
-- Bus Service App - Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. users table
--    Mirrors auth.users but adds our app-specific "role" column.
--    id matches auth.users.id exactly (1:1), so RLS policies can compare
--    auth.uid() directly against this table's id.
-- ----------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. collections table
--    One row per bus per day of ticket collection.
-- ----------------------------------------------------------------------------
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  bus_number text not null,
  date date not null,
  amount numeric(10, 2) not null check (amount >= 0),
  staff_id uuid not null references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_collections_date on public.collections (date);
create index if not exists idx_collections_bus on public.collections (bus_number);

-- ----------------------------------------------------------------------------
-- 3. expenses table
--    One row per bus per day per expense entry (fuel, maintenance, etc).
-- ----------------------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  bus_number text not null,
  date date not null,
  expense_type text not null,
  amount numeric(10, 2) not null check (amount >= 0),
  staff_id uuid not null references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_expenses_date on public.expenses (date);
create index if not exists idx_expenses_bus on public.expenses (bus_number);

-- ----------------------------------------------------------------------------
-- Keep updated_at current whenever a collection/expense row is edited.
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_collections_updated_at on public.collections;
create trigger set_collections_updated_at
  before update on public.collections
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_expenses_updated_at on public.expenses;
create trigger set_expenses_updated_at
  before update on public.expenses
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Helper function used by RLS policies to check "is this caller an admin?"
--    IMPORTANT: this must be SECURITY DEFINER. If an RLS policy on
--    public.users queried public.users directly (e.g. via a plain
--    `exists (select 1 from public.users where ...)`), Postgres would
--    re-trigger RLS on that same inner query, which re-triggers the same
--    policy again - infinite recursion, and Postgres returns a 500 error
--    ("infinite recursion detected in policy") on every request. Marking
--    this function SECURITY DEFINER makes its internal query run with the
--    function owner's privileges (bypassing RLS), breaking the loop.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- 5. Auto-create a public.users row whenever someone signs up via Supabase Auth
--    New users default to role = 'staff'. Promote an account to 'admin' by
--    running: update public.users set role = 'admin' where email = '...';
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'staff')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

alter table public.users enable row level security;
alter table public.collections enable row level security;
alter table public.expenses enable row level security;

-- --- users table policies ---------------------------------------------------

-- Everyone can read their own profile row (needed to look up their own role).
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

-- Admins can read every profile (needed for the dashboard / user management).
-- Uses the is_admin() helper (see section 4 above) instead of querying
-- public.users directly, to avoid infinite RLS recursion.
create policy "Admins can view all profiles"
  on public.users for select
  using (public.is_admin());

-- --- collections table policies ---------------------------------------------

-- Staff can insert their own collection entries.
create policy "Staff can insert their own collections"
  on public.collections for insert
  with check (auth.uid() = staff_id);

-- Staff can view only the rows they personally entered.
create policy "Staff can view their own collections"
  on public.collections for select
  using (auth.uid() = staff_id);

-- Staff can edit their own collection entries (to fix mistakes).
create policy "Staff can update their own collections"
  on public.collections for update
  using (auth.uid() = staff_id)
  with check (auth.uid() = staff_id);

-- Staff can delete their own collection entries.
create policy "Staff can delete their own collections"
  on public.collections for delete
  using (auth.uid() = staff_id);

-- Admins can view every collection row.
create policy "Admins can view all collections"
  on public.collections for select
  using (public.is_admin());

-- --- expenses table policies --------------------------------------------------

-- Staff can insert their own expense entries.
create policy "Staff can insert their own expenses"
  on public.expenses for insert
  with check (auth.uid() = staff_id);

-- Staff can view only the rows they personally entered.
create policy "Staff can view their own expenses"
  on public.expenses for select
  using (auth.uid() = staff_id);

-- Staff can edit their own expense entries (to fix mistakes).
create policy "Staff can update their own expenses"
  on public.expenses for update
  using (auth.uid() = staff_id)
  with check (auth.uid() = staff_id);

-- Staff can delete their own expense entries.
create policy "Staff can delete their own expenses"
  on public.expenses for delete
  using (auth.uid() = staff_id);

-- Admins can view every expense row.
create policy "Admins can view all expenses"
  on public.expenses for select
  using (public.is_admin());

-- ============================================================================
-- Done. Next steps:
--   1. Create your admin + staff accounts via Supabase Dashboard -> Authentication -> Users
--      (or let them sign up - they'll default to role='staff').
--   2. Promote your owner account:
--        update public.users set role = 'admin' where email = 'owner@yourcompany.com';
--   3. Optionally load supabase/seed.sql for sample test data.
-- ============================================================================
