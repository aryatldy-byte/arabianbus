-- ============================================================================
-- Bus Service App - Example seed data
--
-- IMPORTANT: Supabase Auth users can't be created by plain SQL insert (their
-- passwords need to go through Auth's hashing). So seeding test data is a
-- two-step process:
--
-- STEP 1: Create test accounts via Dashboard -> Authentication -> Users -> "Add user"
--   owner@busco.test      (password: Test1234!)   -> will become admin
--   driver1@busco.test    (password: Test1234!)   -> stays staff
--   driver2@busco.test    (password: Test1234!)   -> stays staff
--
--   The `handle_new_user` trigger (see schema.sql) automatically inserts a
--   matching row into public.users with role='staff' for each of these.
--
-- STEP 2: Run the statements below in the SQL Editor to (a) promote the
-- owner account to admin, and (b) insert sample collections/expenses using
-- the real staff_id values from your public.users table.
-- ============================================================================

-- --- Step 2a: Promote the owner account to admin ----------------------------
update public.users
set role = 'admin'
where email = 'owner@busco.test';

-- --- Step 2b: Insert sample collections + expenses --------------------------
-- Replace the staff_id values below with the actual ids from:
--   select id, email, role from public.users;

do $$
declare
  driver1_id uuid;
  driver2_id uuid;
begin
  select id into driver1_id from public.users where email = 'driver1@busco.test';
  select id into driver2_id from public.users where email = 'driver2@busco.test';

  if driver1_id is null or driver2_id is null then
    raise notice 'Create driver1@busco.test and driver2@busco.test in Supabase Auth first, then re-run this script.';
    return;
  end if;

  -- Sample daily collections for the last few days, both buses.
  insert into public.collections (bus_number, date, amount, staff_id) values
    ('KL-01-AB-1234', current_date - interval '4 day', 4200.00, driver1_id),
    ('KL-01-AB-1234', current_date - interval '3 day', 3900.50, driver1_id),
    ('KL-01-AB-1234', current_date - interval '2 day', 4600.00, driver1_id),
    ('KL-01-AB-1234', current_date - interval '1 day', 4100.75, driver1_id),
    ('KL-01-AB-1234', current_date,                    4300.00, driver1_id),
    ('KL-01-AB-5678', current_date - interval '4 day', 3800.00, driver2_id),
    ('KL-01-AB-5678', current_date - interval '3 day', 4050.25, driver2_id),
    ('KL-01-AB-5678', current_date - interval '2 day', 3950.00, driver2_id),
    ('KL-01-AB-5678', current_date - interval '1 day', 4200.00, driver2_id),
    ('KL-01-AB-5678', current_date,                    4000.00, driver2_id);

  -- Sample daily expenses for the same period, both buses.
  insert into public.expenses (bus_number, date, expense_type, amount, staff_id) values
    ('KL-01-AB-1234', current_date - interval '4 day', 'Fuel',            1500.00, driver1_id),
    ('KL-01-AB-1234', current_date - interval '3 day', 'Toll/Permit',     300.00,  driver1_id),
    ('KL-01-AB-1234', current_date - interval '2 day', 'Fuel',            1600.00, driver1_id),
    ('KL-01-AB-1234', current_date - interval '1 day', 'Driver Salary',   800.00,  driver1_id),
    ('KL-01-AB-1234', current_date,                    'Maintenance',     500.00,  driver1_id),
    ('KL-01-AB-5678', current_date - interval '4 day', 'Fuel',            1400.00, driver2_id),
    ('KL-01-AB-5678', current_date - interval '3 day', 'Conductor Salary',700.00,  driver2_id),
    ('KL-01-AB-5678', current_date - interval '2 day', 'Fuel',            1550.00, driver2_id),
    ('KL-01-AB-5678', current_date - interval '1 day', 'Insurance',       450.00,  driver2_id),
    ('KL-01-AB-5678', current_date,                    'Other',           200.00,  driver2_id);
end $$;

-- --- Sanity check: view combined totals per bus -----------------------------
select
  bus_number,
  sum(collected) as total_collection,
  sum(spent) as total_expense,
  sum(collected) - sum(spent) as net
from (
  select bus_number, amount as collected, 0 as spent from public.collections
  union all
  select bus_number, 0 as collected, amount as spent from public.expenses
) t
group by bus_number;
