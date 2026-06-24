alter table public.trips
  add column if not exists budget_total numeric not null default 5000
  check (budget_total >= 0);

alter table public.trip_items
  add column if not exists price_per_person numeric not null default 0
  check (price_per_person >= 0);

alter table public.expenses
  add column if not exists category text not null default 'General';

create table if not exists public.expense_settlements (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  paid_by uuid not null references auth.users(id),
  paid_to uuid not null references auth.users(id),
  amount numeric not null check (amount > 0),
  created_at timestamp with time zone not null default now(),
  check (paid_by <> paid_to)
);

create index if not exists expenses_trip_id_idx
  on public.expenses(trip_id);

create index if not exists expense_settlements_trip_id_idx
  on public.expense_settlements(trip_id);
