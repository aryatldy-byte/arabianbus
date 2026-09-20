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
  created_at timestamptz not null default now()
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
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_date on public.expenses (date);
create index if not exists idx_expenses_bus on public.expenses (bus_number);

-- ----------------------------------------------------------------------------
-- 4. Auto-create a public.users row whenever someone signs up via Supabase Auth
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
create policy "Admins can view all profiles"
  on public.users for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- --- collections table policies ---------------------------------------------

-- Staff can insert their own collection entries.
create policy "Staff can insert their own collections"
  on public.collections for insert
  with check (auth.uid() = staff_id);

-- Staff can view only the rows they personally entered.
create policy "Staff can view their own collections"
  on public.collections for select
  using (auth.uid() = staff_id);

-- Admins can view every collection row.
create policy "Admins can view all collections"
  on public.collections for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- --- expenses table policies --------------------------------------------------

-- Staff can insert their own expense entries.
create policy "Staff can insert their own expenses"
  on public.expenses for insert
  with check (auth.uid() = staff_id);

-- Staff can view only the rows they personally entered.
create policy "Staff can view their own expenses"
  on public.expenses for select
  using (auth.uid() = staff_id);

-- Admins can view every expense row.
create policy "Admins can view all expenses"
  on public.expenses for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- ============================================================================
-- Done. Next steps:
--   1. Create your admin + staff accounts via Supabase Dashboard -> Authentication -> Users
--      (or let them sign up - they'll default to role='staff').
--   2. Promote your owner account:
--        update public.users set role = 'admin' where email = 'owner@yourcompany.com';
--   3. Optionally load supabase/seed.sql for sample test data.
-- ============================================================================
