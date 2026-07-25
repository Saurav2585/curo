-- Curo — appointment lifecycle & workflow foundation
-- ADDITIVE ONLY. Introduces the canonical appointment state machine as an
-- append-only history of transitions. This is an OVERLAY: it does not touch
-- appointments.status, the double-book index, the slot engine, or any booking
-- behaviour. The existing status remains the source of truth for booking; the
-- lifecycle engine (lib/workflow.ts) derives a richer state on top.
--
-- The transition MAP lives only in lib/workflow.ts (the single engine). This
-- table just stores validated history; the append function authorises the
-- caller but does not re-encode the map. Nothing auto-transitions. Run after
-- 0016_audit_logs.sql.

do $$ begin
  create type workflow_state as enum (
    'requested', 'confirmed', 'checked_in', 'in_consultation',
    'completed', 'cancelled', 'rescheduled', 'no_show', 'follow_up_recommended'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.appointment_lifecycle_events (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  from_state     workflow_state,             -- null for the initial entry
  to_state       workflow_state not null,
  actor_id       uuid references public.profiles(id) on delete set null,
  actor_label    text,
  note           text,
  created_at     timestamptz not null default now()
);

create index if not exists lifecycle_events_appt_idx
  on public.appointment_lifecycle_events (appointment_id, created_at);

alter table public.appointment_lifecycle_events enable row level security;

-- Read: the appointment's patient, the appointment's doctor, or an admin.
drop policy if exists lifecycle_read_related on public.appointment_lifecycle_events;
create policy lifecycle_read_related on public.appointment_lifecycle_events
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.appointments a
      where a.id = appointment_lifecycle_events.appointment_id
        and (
          a.patient_id = auth.uid()
          or exists (select 1 from public.doctors d
                     where d.id = a.doctor_id and d.profile_id = auth.uid())
        )
    )
  );

-- No INSERT/UPDATE/DELETE policies: writes go through append_lifecycle_event()
-- and the trigger below makes history immutable.
create or replace function public.lifecycle_events_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'appointment_lifecycle_events are immutable: % is not permitted', tg_op;
end;
$$;

drop trigger if exists lifecycle_no_mutate on public.appointment_lifecycle_events;
create trigger lifecycle_no_mutate
  before update or delete on public.appointment_lifecycle_events
  for each row execute function public.lifecycle_events_immutable();

-- ---------------------------------------------------------------- append
-- Authorised append. The doctor who owns the appointment (or an admin) may add a
-- transition. Legality of the transition is validated in the TS engine BEFORE
-- this is called — this function only enforces authorisation and records who
-- acted. Booking is never touched.
create or replace function public.append_lifecycle_event(
  p_appointment uuid,
  p_from        workflow_state,
  p_to          workflow_state,
  p_note        text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid; v_ok boolean; v_label text;
begin
  select (
    public.is_admin()
    or exists (
      select 1 from public.appointments a
      join public.doctors d on d.id = a.doctor_id
      where a.id = p_appointment and d.profile_id = auth.uid()
    )
  ) into v_ok;

  if not v_ok then
    raise exception 'not authorised to transition this appointment';
  end if;

  select full_name into v_label from public.profiles where id = auth.uid();

  insert into public.appointment_lifecycle_events
    (appointment_id, from_state, to_state, actor_id, actor_label, note)
  values (p_appointment, p_from, p_to, auth.uid(), v_label, p_note)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.append_lifecycle_event(uuid, workflow_state, workflow_state, text)
  to authenticated;

-- ---------------------------------------------------------------- demo seed
-- One illustrative completed journey so the timeline surfaces aren't empty.
-- Idempotent: only when the table is currently empty. Inserts at owner level
-- (the immutability trigger only blocks UPDATE/DELETE).
do $$
declare v_appt uuid; v_doctor_profile uuid; v_created timestamptz;
begin
  if exists (select 1 from public.appointment_lifecycle_events) then return; end if;

  select a.id, d.profile_id, a.created_at
    into v_appt, v_doctor_profile, v_created
  from public.appointments a
  join public.doctors d on d.id = a.doctor_id
  where a.status = 'completed'
  order by a.starts_at desc
  limit 1;

  if v_appt is not null then
    insert into public.appointment_lifecycle_events
      (appointment_id, from_state, to_state, actor_id, actor_label, note, created_at) values
      (v_appt, null,               'confirmed',       v_doctor_profile, 'Clinic', 'Appointment confirmed',     coalesce(v_created, now() - interval '3 days')),
      (v_appt, 'confirmed',        'checked_in',      v_doctor_profile, 'Front desk', 'Patient checked in',    coalesce(v_created, now() - interval '3 days') + interval '2 hours'),
      (v_appt, 'checked_in',       'in_consultation', v_doctor_profile, 'Doctor', 'Consultation started',      coalesce(v_created, now() - interval '3 days') + interval '2 hours 10 minutes'),
      (v_appt, 'in_consultation',  'completed',       v_doctor_profile, 'Doctor', 'Consultation completed',    coalesce(v_created, now() - interval '3 days') + interval '2 hours 35 minutes');
  end if;
end $$;
