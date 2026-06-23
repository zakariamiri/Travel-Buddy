alter table public.trip_notifications
  drop constraint if exists trip_notifications_type_check;

alter table public.trip_notifications
  add constraint trip_notifications_type_check
  check (type in ('activity_created', 'member_joined'));
