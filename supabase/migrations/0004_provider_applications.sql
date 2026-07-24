-- Curo — provider onboarding
-- Additive only. Touches no existing table, relationship, or policy.
-- Run in Supabase Studio → SQL Editor after 0003_doctor_stats.sql.
--
-- Security model, enforced here:
--   • A provider signup creates a PENDING application. It does NOT grant the
--     doctor role and does NOT create a doctors row.
--   • Role elevation happens ONLY through approve_provider_application(), a
--     security-definer function callable by an admin. The client can never set
--     its own role.

do $$ begin
  create type application_status as enum
    ('pending', 'under_review', 'info_requested', 'approved', 'rejected', 'suspended');
exception when duplicate_object then null; end $$;

create table if not exists public.provider_applications (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references auth.users(id) on delete cascade,
  full_name           text not null,
  email               text not null,
  phone               text,
  clinic_name         text not null,
  city                text not null,
  specialty           text not null,
  registration_number text not null,
  qualifications      text not null,
  consultation_fee    numeric(10,2) not null default 500 check (consultation_fee >= 0),
  status              application_status not null default 'pending',
  review_notes        text,
  created_at          timestamptz not null default now(),
  reviewed_at         timestamptz
);

create index if not exists provider_apps_status_idx on public.provider_applications (status);

-- ---------------------------------------------------------------- RLS
alter table public.provider_applications enable row level security;

-- An applicant may read and create their own application, and update it only
-- while it still needs their input (pending / info requested).
drop policy if exists provider_app_read_own   on public.provider_applications;
drop policy if exists provider_app_insert_own on public.provider_applications;
drop policy if exists provider_app_update_own on public.provider_applications;

create policy provider_app_read_own on public.provider_applications
  for select using (auth.uid() = user_id);

create policy provider_app_insert_own on public.provider_applications
  for insert with check (auth.uid() = user_id);

create policy provider_app_update_own on public.provider_applications
  for update using (auth.uid() = user_id and status in ('pending', 'info_requested'))
              with check (auth.uid() = user_id);

-- Admins can see and manage every application.
drop policy if exists provider_app_admin_all on public.provider_applications;
create policy provider_app_admin_all on public.provider_applications
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------------------------------------------------------------- approval
-- Admin-only. Elevates the applicant to a real, active doctor. This is the ONLY
-- path that grants the doctor role, so privilege can never be self-assigned.
create or replace function public.approve_provider_application(p_app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a               public.provider_applications;
  v_specialty_id  uuid;
  v_clinic_id     uuid;
  v_slug          text;
begin
  -- Caller must be an admin.
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only an admin may approve applications';
  end if;

  select * into a from public.provider_applications where id = p_app_id;
  if a.id is null then raise exception 'Application not found'; end if;

  -- Resolve specialty by name, else fall back to General Physician.
  select id into v_specialty_id from public.specialties
   where name ilike a.specialty limit 1;
  if v_specialty_id is null then
    select id into v_specialty_id from public.specialties where slug = 'general-physician';
  end if;

  -- Resolve or create the clinic by name.
  select id into v_clinic_id from public.clinics where name = a.clinic_name limit 1;
  if v_clinic_id is null then
    insert into public.clinics (name, address_line, city)
    values (a.clinic_name, a.clinic_name, a.city)
    returning id into v_clinic_id;
  end if;

  -- Unique slug from the name.
  v_slug := regexp_replace(lower(a.full_name), '[^a-z0-9]+', '-', 'g') || '-' ||
            substr(a.user_id::text, 1, 4);

  -- Create the doctor, linked to the applicant's login.
  insert into public.doctors
    (profile_id, specialty_id, clinic_id, slug, full_name, qualifications,
     consultation_fee, is_active)
  values
    (a.user_id, v_specialty_id, v_clinic_id, v_slug, a.full_name, a.qualifications,
     a.consultation_fee, true)
  on conflict (slug) do nothing;

  -- Elevate the role and close the application.
  update public.profiles set role = 'doctor' where id = a.user_id;
  update public.provider_applications
     set status = 'approved', reviewed_at = now()
   where id = p_app_id;
end $$;

grant execute on function public.approve_provider_application(uuid) to authenticated;

-- Convenience for the demo: set a chosen application's reviewer decision.
create or replace function public.set_application_status(p_app_id uuid, p_status application_status, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only an admin may change application status';
  end if;
  update public.provider_applications
     set status = p_status, review_notes = p_notes, reviewed_at = now()
   where id = p_app_id;
end $$;

grant execute on function public.set_application_status(uuid, application_status, text) to authenticated;
