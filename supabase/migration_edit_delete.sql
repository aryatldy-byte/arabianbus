-- ============================================================================
-- Migration: allow staff to edit/delete their OWN collection & expense
-- entries (previously insert-only). Safe to run on an existing database
-- that already has schema.sql applied - uses IF NOT EXISTS / OR REPLACE /
-- DROP POLICY IF EXISTS everywhere so it won't error on re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Track when a row was last edited (shown in the UI, useful for audit).
-- ----------------------------------------------------------------------------
alter table public.collections add column if not exists updated_at timestamptz not null default now();
alter table public.expenses add column if not exists updated_at timestamptz not null default now();

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
-- 2. RLS: staff can update/delete rows where they are the original staff_id.
--    (Admins already have full read access from schema.sql; this migration
--    does not grant admins write access - only the original staff member
--    can edit/delete their own entries.)
-- ----------------------------------------------------------------------------
drop policy if exists "Staff can update their own collections" on public.collections;
create policy "Staff can update their own collections"
  on public.collections for update
  using (auth.uid() = staff_id)
  with check (auth.uid() = staff_id);

drop policy if exists "Staff can delete their own collections" on public.collections;
create policy "Staff can delete their own collections"
  on public.collections for delete
  using (auth.uid() = staff_id);

drop policy if exists "Staff can update their own expenses" on public.expenses;
create policy "Staff can update their own expenses"
  on public.expenses for update
  using (auth.uid() = staff_id)
  with check (auth.uid() = staff_id);

drop policy if exists "Staff can delete their own expenses" on public.expenses;
create policy "Staff can delete their own expenses"
  on public.expenses for delete
  using (auth.uid() = staff_id);
