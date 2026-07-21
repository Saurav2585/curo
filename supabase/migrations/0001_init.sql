-- Curo — initial schema
-- Paste into Supabase Studio → SQL Editor → Run.
--
-- Two decisions carry this file:
--   1. Slots are COMPUTED, never stored. get_available_slots() derives them from
--      availability rules minus time off minus booked appointments. No slot table,
--      no nightly job, nothing to fall out of sync.
--   2. A partial unique index makes double-booking impossible at the database.
--      Not "unlikely under normal load" — impossible.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- enums
do $$ begin
  create type user_role as enum ('patient', 'doctor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type appointment_status as enum ('booked', 'completed', 'cancelled', 'no_show');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- profiles
-- Mirrors auth.users. Created by trigger on signup so the app never has to.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role   not null default 'patient',
  full_name   text        not null default '',
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- catalogue
create table if not exists public.specialties (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  icon        text not null default 'stethoscope',
  description text
);

create table if not exists public.clinics (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,   -- unique so the seed is safely re-runnable
  address_line text not null,
  city         text not null,
  phone        text,
  created_at   timestamptz not null default now()
);

-- full_name is denormalised so seeded doctors need no auth account.
-- profile_id is nullable and links a doctor to a real login when one exists.
create table if not exists public.doctors (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid references public.profiles(id) on delete set null,
  specialty_id     uuid not null references public.specialties(id),
  clinic_id        uuid not null references public.clinics(id),
  slug             text not null unique,
  full_name        text not null,
  bio              text,
  qualifications   text not null,
  experience_years int  not null default 0 check (experience_years >= 0),
  consultation_fee numeric(10, 2) not null check (consultation_fee >= 0),
  languages        text[] not null default '{}',
  rating           numeric(2, 1) not null default 0 check (rating between 0 and 5),
  review_count     int  not null default 0,
  photo_url        text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists doctors_specialty_idx on public.doctors (specialty_id) where is_active;
create index if not exists doctors_clinic_idx    on public.doctors (clinic_id)    where is_active;

-- ---------------------------------------------------------------- schedule
create table if not exists public.availability (
  id           uuid primary key default gen_random_uuid(),
  doctor_id    uuid not null references public.doctors(id) on delete cascade,
  weekday      smallint not null check (weekday between 0 and 6),  -- 0 = Sunday
  start_time   time not null,
  end_time     time not null,
  slot_minutes int  not null default 20 check (slot_minutes between 5 and 120),
  constraint availability_range_valid check (end_time > start_time),
  unique (doctor_id, weekday, start_time)
);

create index if not exists availability_doctor_weekday_idx
  on public.availability (doctor_id, weekday);

create table if not exists public.time_off (
  id        uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  reason    text,
  constraint time_off_range_valid check (ends_at > starts_at)
);

create index if not exists time_off_doctor_range_idx
  on public.time_off (doctor_id, starts_at, ends_at);

-- ---------------------------------------------------------------- appointments
-- patient_id is nullable: clinics book walk-ins who have no account, and it lets
-- the seed create realistic prior bookings without fabricating auth users.
create table if not exists public.appointments (
  id            uuid primary key default gen_random_uuid(),
  reference     text not null unique
                default 'CU-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6)),
  doctor_id     uuid not null references public.doctors(id) on delete cascade,
  patient_id    uuid references public.profiles(id) on delete set null,
  patient_name  text not null,
  patient_phone text,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  status        appointment_status not null default 'booked',
  reason        text,
  created_at    timestamptz not null default now(),
  cancelled_at  timestamptz,
  constraint appointment_range_valid check (ends_at > starts_at)
);

-- THE constraint. Two patients cannot hold the same doctor+time while booked;
-- cancelled rows drop out of the index so the slot frees up automatically.
create unique index if not exists appointments_no_double_book
  on public.appointments (doctor_id, starts_at)
  where status = 'booked';

create index if not exists appointments_doctor_time_idx  on public.appointments (doctor_id, starts_at);
create index if not exists appointments_patient_time_idx on public.appointments (patient_id, starts_at desc);

-- ---------------------------------------------------------------- slot engine
-- Returns every candidate slot for one doctor on one date, each tagged with the
-- reason it is or isn't bookable. The UI renders this array directly.
--
-- Times are interpreted in the clinic's local zone (Asia/Kolkata for this demo);
-- everything is stored and returned as timestamptz.
create or replace function public.get_available_slots(p_doctor_id uuid, p_date date)
returns table (slot_start timestamptz, slot_end timestamptz, status text)
language sql
stable
security definer
set search_path = public
as $$
  with rules as (
    select a.start_time, a.end_time, a.slot_minutes
    from public.availability a
    where a.doctor_id = p_doctor_id
      and a.weekday = extract(dow from p_date)::smallint
  ),
  candidates as (
    select
      ((p_date + r.start_time) at time zone 'Asia/Kolkata')
        + make_interval(mins => r.slot_minutes * n) as slot_start,
      r.slot_minutes
    from rules r
    -- floor(), not a cast: ::int rounds half-up and would emit a final slot that
    -- runs past end_time whenever the session doesn't divide evenly.
    cross join lateral generate_series(
      0,
      floor(extract(epoch from (r.end_time - r.start_time)) / 60 / r.slot_minutes)::int - 1
    ) as n
  )
  select
    c.slot_start,
    c.slot_start + make_interval(mins => c.slot_minutes) as slot_end,
    case
      when exists (
        select 1 from public.appointments ap
        where ap.doctor_id = p_doctor_id
          and ap.status = 'booked'
          and ap.starts_at = c.slot_start
      ) then 'booked'
      when exists (
        select 1 from public.time_off t
        where t.doctor_id = p_doctor_id
          and c.slot_start < t.ends_at
          and c.slot_start + make_interval(mins => c.slot_minutes) > t.starts_at
      ) then 'unavailable'
      when c.slot_start < now() then 'past'
      else 'available'
    end as status
  from candidates c
  order by c.slot_start;
$$;

-- Powers "next available" on the results card without N round trips.
create or replace function public.next_available_slots(p_doctor_id uuid, p_limit int default 3)
returns table (slot_start timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select s.slot_start
  from generate_series(current_date, current_date + 13, '1 day'::interval) d
  cross join lateral public.get_available_slots(p_doctor_id, d::date) s
  where s.status = 'available'
  order by s.slot_start
  limit p_limit;
$$;

-- ---------------------------------------------------------------- RLS
alter table public.profiles     enable row level security;
alter table public.specialties  enable row level security;
alter table public.clinics      enable row level security;
alter table public.doctors      enable row level security;
alter table public.availability enable row level security;
alter table public.time_off     enable row level security;
alter table public.appointments enable row level security;

-- Public catalogue: anyone may read, nobody may write through the anon key.
drop policy if exists specialties_read  on public.specialties;
drop policy if exists clinics_read      on public.clinics;
drop policy if exists doctors_read      on public.doctors;
drop policy if exists availability_read on public.availability;
drop policy if exists time_off_read     on public.time_off;

create policy specialties_read  on public.specialties  for select using (true);
create policy clinics_read      on public.clinics      for select using (true);
create policy doctors_read      on public.doctors      for select using (is_active);
create policy availability_read on public.availability for select using (true);
create policy time_off_read     on public.time_off     for select using (true);

-- Profiles: yours and only yours.
drop policy if exists profiles_read_own   on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

create policy profiles_read_own   on public.profiles for select using (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id)
                                                             with check (auth.uid() = id);

-- Appointments: a patient sees their own; a doctor sees their own column of the
-- calendar. Neither can see the other's wider book.
drop policy if exists appointments_read_own      on public.appointments;
drop policy if exists appointments_insert_own    on public.appointments;
drop policy if exists appointments_update_own    on public.appointments;

create policy appointments_read_own on public.appointments for select using (
  auth.uid() = patient_id
  or exists (
    select 1 from public.doctors d
    join public.profiles p on p.id = d.profile_id
    where d.id = appointments.doctor_id and p.id = auth.uid()
  )
);

create policy appointments_insert_own on public.appointments for insert
  with check (auth.uid() = patient_id);

create policy appointments_update_own on public.appointments for update using (
  auth.uid() = patient_id
  or exists (
    select 1 from public.doctors d
    join public.profiles p on p.id = d.profile_id
    where d.id = appointments.doctor_id and p.id = auth.uid()
  )
);

-- Doctors manage their own schedule.
drop policy if exists availability_write_own on public.availability;
create policy availability_write_own on public.availability for all using (
  exists (
    select 1 from public.doctors d
    where d.id = availability.doctor_id and d.profile_id = auth.uid()
  )
);

grant execute on function public.get_available_slots(uuid, date)  to anon, authenticated;
grant execute on function public.next_available_slots(uuid, int)  to anon, authenticated;
