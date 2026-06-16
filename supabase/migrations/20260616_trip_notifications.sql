create table if not exists public.trip_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  trip_id uuid not null references public.trips(id) on delete cascade,
  activity_id uuid references public.trip_items(id) on delete cascade,
  type text not null check (type in ('activity_created')),
  title text not null,
  message text not null,
  read_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create index if not exists trip_notifications_recipient_created_idx
  on public.trip_notifications(recipient_id, created_at desc);

create index if not exists trip_notifications_trip_id_idx
  on public.trip_notifications(trip_id);
