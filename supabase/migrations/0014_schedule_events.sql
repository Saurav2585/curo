-- Curo — availability & schedule-exception foundation
-- ADDITIVE ONLY. This introduces a single reusable table for schedule
-- exceptions (leave, holidays, closures, blocked periods, one-off overrides).
--
-- It deliberately does NOT touch:
--   • public.availability   (recurring weekly rules — unchanged)
--   • public.time_off       (already consumed by the slot engine — unchanged)
--   • get_available_slots() / next_available_slots()  (slot generation unchanged)
--
-- Booking behaviour is EXACTLY as before. These rows are metadata the FUTURE
-- booking validator can consume; nothing reads them for slot generation today.
-- Run after 0013_reviews.sql.

do $$ begin
  create type schedule_event_kind as enum (
    'full_day_leave',    -- exception: away for a full day
    'half_day_leave',    -- exception: away for part of a day
    'vacation',          -- exception: multi-day leave
    'public_holiday',    -- exception: clinic observes a holiday
    'clinic_closed',     -- exception: planned closure
    'emergency_closure', -- exception: unplanned closure
    'custom_block',      -- blocked period: lunch, meeting, surgery, conference…
    'override'           -- one-off override: open later / close earlier / extra hours / unavailable
  );
exception when duplicate_object then null; end $$;

create table if not exists public.schedule_events (
  id           uuid primary key default gen_random_uuid(),
  doctor_id    uuid not null references public.doctors(id) on delete cascade,
  kind         schedule_event_kind not null,
  title        text,                 -- e.g. "Lunch", "Diwali", "Surgery"
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  all_day      boolean not null default false,
  -- Only meaningful for kind = 'override':
  --   true  → adds/opens hours (open later start, extra clinic hours)
  --   false → removes hours (close earlier, unavailable)
  override_adds_hours boolean,
  note         text,
  created_at   timestamptz not null default now(),
  constraint schedule_events_range_valid check (ends_at > starts_at)
);

create index if not exists schedule_events_doctor_range_idx
  on public.schedule_events (doctor_id, starts_at, ends_at);
create index if not exists schedule_events_kind_idx
  on public.schedule_events (doctor_id, kind);

alter table public.schedule_events enable row level security;

-- Provider manages their OWN events (create / read / update / delete).
drop policy if exists schedule_events_owner_all on public.schedule_events;
create policy schedule_events_owner_all on public.schedule_events
  for all using (
    exists (select 1 from public.doctors d
            where d.id = schedule_events.doctor_id and d.profile_id = auth.uid())
  ) with check (
    exists (select 1 from public.doctors d
            where d.id = schedule_events.doctor_id and d.profile_id = auth.uid())
  );

-- Public may read only patient-facing exceptions (leave / closures), so the
-- public profile can show "On leave" / "Clinic closed" / "Returning on…".
-- Private operational blocks (lunch, meetings) and overrides are NOT exposed.
drop policy if exists schedule_events_read_public on public.schedule_events;
create policy schedule_events_read_public on public.schedule_events
  for select using (
    kind in ('full_day_leave','half_day_leave','vacation',
             'public_holiday','clinic_closed','emergency_closure')
  );

-- Admin: READ ONLY (no write policy → admins can view but never edit).
drop policy if exists schedule_events_admin_read on public.schedule_events;
create policy schedule_events_admin_read on public.schedule_events
  for select using (public.is_admin());

-- ---------------------------------------------------------------- demo seed
-- A few illustrative events for the demo doctor so the new surfaces aren't
-- empty. Idempotent: only inserts when this doctor has no events yet.
do $$
declare v_doctor uuid;
begin
  select id into v_doctor from public.doctors order by created_at limit 1;
  if v_doctor is not null
     and not exists (select 1 from public.schedule_events where doctor_id = v_doctor) then
    insert into public.schedule_events (doctor_id, kind, title, starts_at, ends_at, all_day, override_adds_hours, note) values
      (v_doctor, 'vacation',      'Annual leave',
        (current_date + 7)  + time '00:00', (current_date + 10) + time '23:59', true,  null, 'Back the following Monday'),
      (v_doctor, 'public_holiday','Independence Day',
        date '2026-08-15' + time '00:00',   date '2026-08-15' + time '23:59',   true,  null, null),
      (v_doctor, 'custom_block',  'Lunch',
        (current_date + 1)  + time '13:00', (current_date + 1)  + time '14:00', false, null, 'Daily lunch break'),
      (v_doctor, 'override',      'Extra evening clinic',
        (current_date + 2)  + time '19:00', (current_date + 2)  + time '21:00', false, true, 'Additional hours this week');
  end if;
end $$;
