create table if not exists public.trip_invitations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  invited_email text not null,
  invite_code text not null,
  invited_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamp with time zone not null default now(),
  accepted_at timestamp with time zone,
  unique (trip_id, invited_email)
);

create index if not exists trip_invitations_email_status_idx
  on public.trip_invitations(lower(invited_email), status);

create index if not exists trip_invitations_invite_code_idx
  on public.trip_invitations(invite_code);
