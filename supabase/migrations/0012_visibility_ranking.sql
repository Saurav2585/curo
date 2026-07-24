-- Curo — provider visibility & ranking foundation
-- Additive only. Adds a visibility level and a sponsored weight to doctors, plus
-- an admin-only setter. Changes NOTHING about search ordering — the public
-- search still orders exactly as before. Future paid visibility only needs to
-- change visibility_level here.
--
-- Run after 0011_admin_policies.sql.

alter table public.doctors
  add column if not exists visibility_level text not null default 'standard'
    check (visibility_level in ('standard', 'featured', 'sponsored')),
  add column if not exists sponsored_weight numeric not null default 0;

-- Admin-only: set a provider's visibility level. Re-checks admin at the DB.
create or replace function public.set_provider_visibility(p_doctor_id uuid, p_level text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only an admin may change visibility';
  end if;
  if p_level not in ('standard', 'featured', 'sponsored') then
    raise exception 'Invalid visibility level';
  end if;
  update public.doctors set visibility_level = p_level where id = p_doctor_id;
end $$;

grant execute on function public.set_provider_visibility(uuid, text) to authenticated;
