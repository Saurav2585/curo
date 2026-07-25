-- Curo — audit log & activity history foundation
-- ADDITIVE ONLY. The platform's permanent, IMMUTABLE operational history.
--
-- Audit logs are NOT notifications and are independent of them. Notifications
-- may reference audit events in future, but this table stands alone. Entries are
-- append-only: there are no UPDATE/DELETE policies and a trigger hard-blocks
-- mutation, so history can never be altered or erased.
--
-- Nothing existing is modified: booking, auth, subscriptions, billing,
-- promotions, notifications, reviews and availability are untouched. Audit
-- recording is NOT wired into any existing flow in this phase — foundation only.
-- Run after 0015_notifications.sql.

-- The catalogue. Extend by adding a value here and a metadata entry in
-- lib/audit.ts — nothing else changes.
do $$ begin
  create type audit_event_type as enum (
    'user_login', 'user_logout', 'profile_updated', 'password_changed',
    'appointment_created', 'appointment_cancelled', 'appointment_completed',
    'provider_application_submitted', 'provider_approved', 'provider_rejected', 'provider_suspended',
    'subscription_updated', 'promotion_updated', 'visibility_changed',
    'review_submitted', 'review_hidden', 'schedule_updated'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  event_type   audit_event_type not null,
  actor_id     uuid references public.profiles(id) on delete set null,
  actor_label  text,                 -- denormalised name snapshot (profiles are private)
  target_type  text,                 -- e.g. 'appointment', 'doctor', 'review'
  target_id    uuid,
  target_label text,
  ip_address   text,                 -- placeholder (not captured yet)
  user_agent   text,                 -- placeholder (not captured yet)
  metadata     jsonb not null default '{}'::jsonb,
  success      boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx   on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_target_idx  on public.audit_logs (target_id, created_at desc);
create index if not exists audit_logs_type_idx    on public.audit_logs (event_type, created_at desc);

alter table public.audit_logs enable row level security;

-- Admin reads the whole platform history.
drop policy if exists audit_logs_admin_read on public.audit_logs;
create policy audit_logs_admin_read on public.audit_logs
  for select using (public.is_admin());

-- A user reads history where they are the actor OR the target (their own
-- account / practice activity). Providers see actions taken on their profile;
-- patients see their own account activity.
drop policy if exists audit_logs_read_own on public.audit_logs;
create policy audit_logs_read_own on public.audit_logs
  for select using (auth.uid() = actor_id or auth.uid() = target_id);

-- No INSERT/UPDATE/DELETE policies: writes go through record_audit() (security
-- definer), and the trigger below makes rows immutable for everyone.

-- Immutability guard — reject any attempt to change or remove history.
create or replace function public.audit_logs_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_logs are immutable: % is not permitted', tg_op;
end;
$$;

drop trigger if exists audit_logs_no_mutate on public.audit_logs;
create trigger audit_logs_no_mutate
  before update or delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();

-- ---------------------------------------------------------------- central record
-- The one way history is written. Append-only; callers never touch the table
-- directly. IP / user-agent are accepted as placeholders for future capture.
create or replace function public.record_audit(
  p_event       audit_event_type,
  p_actor       uuid default null,
  p_actor_label text default null,
  p_target_type text default null,
  p_target_id   uuid default null,
  p_target_label text default null,
  p_metadata    jsonb default '{}'::jsonb,
  p_success     boolean default true,
  p_ip          text default null,
  p_user_agent  text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  insert into public.audit_logs
    (event_type, actor_id, actor_label, target_type, target_id, target_label,
     ip_address, user_agent, metadata, success)
  values
    (p_event, p_actor, p_actor_label, p_target_type, p_target_id, p_target_label,
     p_ip, p_user_agent, coalesce(p_metadata, '{}'::jsonb), coalesce(p_success, true))
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.record_audit(
  audit_event_type, uuid, text, text, uuid, text, jsonb, boolean, text, text
) to authenticated;

-- ---------------------------------------------------------------- demo seed
-- Illustrative history so the audit and activity surfaces aren't empty.
-- Idempotent: seeds only when the log is currently empty. Inserts happen at
-- migration-owner level (the immutability trigger only blocks UPDATE/DELETE).
do $$
declare v_doctor uuid; v_doctor_name text; v_admin uuid; v_patient uuid;
begin
  if exists (select 1 from public.audit_logs) then return; end if;

  select profile_id, full_name into v_doctor, v_doctor_name
    from public.doctors where profile_id is not null order by created_at limit 1;
  select id into v_admin from public.profiles where role = 'admin' order by id limit 1;
  select id into v_patient from public.profiles where role = 'patient' order by id limit 1;

  if v_doctor is not null then
    insert into public.audit_logs (event_type, actor_id, actor_label, target_type, target_id, target_label, metadata, created_at) values
      ('user_login',        v_doctor, v_doctor_name, 'profile', v_doctor, v_doctor_name, '{}',                          now() - interval '3 hours'),
      ('schedule_updated',  v_doctor, v_doctor_name, 'doctor',  v_doctor, v_doctor_name, '{"change":"added evening session"}', now() - interval '1 day'),
      ('visibility_changed',v_admin,  'Platform admin','doctor', v_doctor, v_doctor_name, '{"level":"featured"}',        now() - interval '2 days'),
      ('profile_updated',   v_doctor, v_doctor_name, 'doctor',  v_doctor, v_doctor_name, '{"fields":["bio","fee"]}',    now() - interval '4 days');
  end if;

  if v_admin is not null then
    insert into public.audit_logs (event_type, actor_id, actor_label, target_type, target_id, target_label, metadata, created_at) values
      ('provider_application_submitted', v_admin, 'System', 'application', null, 'New clinic', '{}',            now() - interval '5 hours'),
      ('promotion_updated',              v_admin, 'Platform admin', 'promotion', null, 'Monsoon offer', '{"status":"active"}', now() - interval '6 days');
  end if;

  if v_patient is not null then
    insert into public.audit_logs (event_type, actor_id, actor_label, target_type, target_id, target_label, metadata, created_at) values
      ('appointment_created', v_patient, 'Patient', 'appointment', null, 'Consultation', '{}', now() - interval '7 hours'),
      ('review_submitted',    v_patient, 'Patient', 'review', null, 'Verified visit', '{}', now() - interval '2 days');
  end if;
end $$;
