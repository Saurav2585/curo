-- Curo — notification & event foundation
-- ADDITIVE ONLY. Introduces the platform's communication layer as reusable
-- architecture: a central event log + in-app notifications that consume events.
--
-- There are NO external delivery providers here. Email / SMS / Push are modelled
-- as channels but only 'in_app' is materialised with UI. Future channels
-- subscribe to the SAME event model (app_events + emit_notification()).
--
-- Nothing existing is modified: booking, auth, subscriptions, billing,
-- promotions, reviews and availability are untouched. Emission is NOT wired into
-- any existing flow in this phase — this is foundation only. Run after
-- 0014_schedule_events.sql.

-- ---------------------------------------------------------------- enums
do $$ begin
  create type notification_channel as enum ('in_app', 'email', 'sms', 'push');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_status as enum ('unread', 'read', 'archived');
exception when duplicate_object then null; end $$;

-- The event catalogue. Extend by adding a value here and a metadata entry in
-- lib/events.ts — no schema change needed elsewhere.
do $$ begin
  create type app_event_type as enum (
    -- appointments
    'appointment_booked', 'appointment_cancelled', 'appointment_completed', 'appointment_rescheduled',
    -- reviews
    'review_submitted', 'review_reported',
    -- provider lifecycle
    'provider_application_submitted', 'doctor_approved', 'doctor_rejected', 'pending_approval',
    -- subscriptions / billing
    'trial_expiring', 'subscription_activated', 'subscription_renewed', 'subscription_cancelled', 'billing_alert',
    -- promotions
    'promotion_available', 'promotion_expiring',
    -- profile / visibility / schedule
    'profile_incomplete', 'visibility_updated', 'leave_created', 'schedule_updated'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- event log
-- The single source of "something happened". Notifications (and future email /
-- sms / push rows) are materialised FROM these.
create table if not exists public.app_events (
  id           uuid primary key default gen_random_uuid(),
  type         app_event_type not null,
  actor_id     uuid references public.profiles(id) on delete set null, -- who triggered it (optional)
  subject_type text,   -- e.g. 'appointment', 'review', 'doctor'
  subject_id   uuid,   -- the affected entity (optional)
  payload      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists app_events_type_idx on public.app_events (type, created_at desc);

-- ---------------------------------------------------------------- notifications
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  event_id     uuid references public.app_events(id) on delete set null,
  event_type   app_event_type not null,
  channel      notification_channel not null default 'in_app',
  status       notification_status not null default 'unread',
  title        text not null,
  message      text,
  action_url   text,
  created_at   timestamptz not null default now(),
  read_at      timestamptz
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, status, created_at desc);

-- ---------------------------------------------------------------- RLS
alter table public.app_events    enable row level security;
alter table public.notifications enable row level security;

-- Recipients see and manage their OWN notifications (mark read / archive).
drop policy if exists notifications_read_own on public.notifications;
create policy notifications_read_own on public.notifications
  for select using (auth.uid() = recipient_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- Admin may read all notifications and the event log (audit / support).
drop policy if exists notifications_admin_read on public.notifications;
create policy notifications_admin_read on public.notifications
  for select using (public.is_admin());

drop policy if exists app_events_admin_read on public.app_events;
create policy app_events_admin_read on public.app_events
  for select using (public.is_admin());

-- No INSERT policy on either table: creation flows THROUGH the security-definer
-- function below, so a user can never fabricate a notification for someone else.

-- ---------------------------------------------------------------- central emit
-- The one way events become notifications. Logs an app_event and materialises an
-- in-app notification for the recipient, bypassing RLS safely. Future channels
-- call this (or read app_events) — notification logic is never page-specific.
create or replace function public.emit_notification(
  p_recipient   uuid,
  p_event       app_event_type,
  p_title       text,
  p_message     text default null,
  p_action_url  text default null,
  p_channel     notification_channel default 'in_app',
  p_actor       uuid default null,
  p_subject_type text default null,
  p_subject_id  uuid default null,
  p_payload     jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_event uuid; v_notification uuid;
begin
  insert into public.app_events (type, actor_id, subject_type, subject_id, payload)
  values (p_event, p_actor, p_subject_type, p_subject_id, coalesce(p_payload, '{}'::jsonb))
  returning id into v_event;

  insert into public.notifications
    (recipient_id, event_id, event_type, channel, title, message, action_url)
  values
    (p_recipient, v_event, p_event, p_channel, p_title, p_message, p_action_url)
  returning id into v_notification;

  return v_notification;
end;
$$;

grant execute on function public.emit_notification(
  uuid, app_event_type, text, text, text, notification_channel, uuid, text, uuid, jsonb
) to authenticated;

-- ---------------------------------------------------------------- demo seed
-- Illustrative in-app notifications so the bell isn't empty in the demo.
-- Idempotent: seeds a recipient only if they currently have none.
do $$
declare v_doctor_profile uuid; v_admin uuid;
begin
  select profile_id into v_doctor_profile from public.doctors
    where profile_id is not null order by created_at limit 1;

  if v_doctor_profile is not null
     and not exists (select 1 from public.notifications where recipient_id = v_doctor_profile) then
    perform public.emit_notification(v_doctor_profile, 'appointment_booked',
      'New appointment booked', 'A patient booked a consultation with you.', '/dashboard/appointments');
    perform public.emit_notification(v_doctor_profile, 'review_submitted',
      'You received a new review', 'A patient left feedback after their visit.', '/dashboard/reputation');
    perform public.emit_notification(v_doctor_profile, 'trial_expiring',
      'Your trial is ending soon', 'Upgrade to keep premium visibility features.', '/dashboard/billing');
    -- mark one as already read to show both states
    update public.notifications set status = 'read', read_at = now()
      where recipient_id = v_doctor_profile and event_type = 'trial_expiring';
  end if;

  select id into v_admin from public.profiles where role = 'admin' order by id limit 1;
  if v_admin is not null
     and not exists (select 1 from public.notifications where recipient_id = v_admin) then
    perform public.emit_notification(v_admin, 'provider_application_submitted',
      'New provider application', 'A clinic submitted an application for review.', '/admin/providers');
    perform public.emit_notification(v_admin, 'review_reported',
      'A review was reported', 'A published review was flagged for moderation.', '/admin/support');
  end if;
end $$;
