-- Curo — full provider application workflow
-- Additive only. Extends the existing provider_applications table and adds a
-- private storage bucket for verification documents. Touches no patient table.
--
-- RUN ORDER NOTE: the two ALTER TYPE lines add enum values. Postgres cannot use
-- a just-added enum value in the SAME transaction, so nothing below sets a
-- default to those values — the app assigns 'draft' / 'submitted' at runtime,
-- after this migration has committed.

alter type application_status add value if not exists 'draft';
alter type application_status add value if not exists 'submitted';

-- ---------------------------------------------------------------- new columns
-- Existing NOT NULL columns must relax so an in-progress DRAFT can be saved
-- before every field is filled in.
alter table public.provider_applications
  alter column full_name           drop not null,
  alter column email               drop not null,
  alter column clinic_name         drop not null,
  alter column city                drop not null,
  alter column specialty           drop not null,
  alter column registration_number drop not null,
  alter column qualifications      drop not null;

alter table public.provider_applications
  add column if not exists provider_type    text not null default 'solo'
    check (provider_type in ('solo', 'clinic', 'hospital')),
  add column if not exists years_experience int,
  add column if not exists address_line     text,
  add column if not exists state            text,
  add column if not exists pin_code         text,
  add column if not exists languages        text[] not null default '{}',
  add column if not exists bio              text,
  add column if not exists reg_cert_path    text,
  add column if not exists gov_id_path      text,
  add column if not exists clinic_reg_path  text,
  add column if not exists hospital_reg_path text;

-- ---------------------------------------------------------------- documents bucket
insert into storage.buckets (id, name, public)
values ('provider-docs', 'provider-docs', false)
on conflict (id) do nothing;

-- Each provider can read/write only their own folder ( {user_id}/... ).
drop policy if exists provider_docs_insert_own on storage.objects;
drop policy if exists provider_docs_read_own   on storage.objects;
drop policy if exists provider_docs_admin_read on storage.objects;

create policy provider_docs_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'provider-docs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy provider_docs_read_own on storage.objects
  for select to authenticated
  using (bucket_id = 'provider-docs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy provider_docs_admin_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'provider-docs'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ---------------------------------------------------------------- approve (updated)
-- Copies the richer application fields into the created doctor row.
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
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only an admin may approve applications';
  end if;

  select * into a from public.provider_applications where id = p_app_id;
  if a.id is null then raise exception 'Application not found'; end if;

  select id into v_specialty_id from public.specialties where name ilike a.specialty limit 1;
  if v_specialty_id is null then
    select id into v_specialty_id from public.specialties where slug = 'general-physician';
  end if;

  select id into v_clinic_id from public.clinics where name = a.clinic_name limit 1;
  if v_clinic_id is null then
    insert into public.clinics (name, address_line, city)
    values (coalesce(a.clinic_name, a.full_name), coalesce(a.address_line, a.clinic_name, ''), coalesce(a.city, ''))
    returning id into v_clinic_id;
  end if;

  v_slug := regexp_replace(lower(a.full_name), '[^a-z0-9]+', '-', 'g') || '-' || substr(a.user_id::text, 1, 4);

  insert into public.doctors
    (profile_id, specialty_id, clinic_id, slug, full_name, bio, qualifications,
     experience_years, consultation_fee, languages, is_active)
  values
    (a.user_id, v_specialty_id, v_clinic_id, v_slug, a.full_name, a.bio, a.qualifications,
     coalesce(a.years_experience, 0), coalesce(a.consultation_fee, 500), coalesce(a.languages, '{}'), true)
  on conflict (slug) do nothing;

  update public.profiles set role = 'doctor' where id = a.user_id;
  update public.provider_applications set status = 'approved', reviewed_at = now() where id = p_app_id;
end $$;

grant execute on function public.approve_provider_application(uuid) to authenticated;

-- ---------------------------------------------------------------- status change (updated)
-- Handles reject / request-info / suspend / reinstate, with the side effect that
-- suspending an approved provider also deactivates their doctor listing (removing
-- them from search and disabling dashboard access), and reinstating restores it.
create or replace function public.set_application_status(
  p_app_id uuid, p_status application_status, p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only an admin may change application status';
  end if;

  select user_id into v_user from public.provider_applications where id = p_app_id;

  update public.provider_applications
     set status = p_status, review_notes = p_notes, reviewed_at = now()
   where id = p_app_id;

  if p_status = 'suspended' then
    update public.doctors set is_active = false where profile_id = v_user;
  elsif p_status = 'approved' then
    update public.doctors set is_active = true where profile_id = v_user;
  end if;
end $$;

grant execute on function public.set_application_status(uuid, application_status, text) to authenticated;
