-- Curo — admin read access
-- Additive only. Lets an admin read the tables the admin console lists. Uses a
-- SECURITY DEFINER is_admin() helper so the profiles policy can check the
-- admin role WITHOUT recursing into its own RLS.
--
-- Run after 0010_billing_domain.sql.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

grant execute on function public.is_admin() to authenticated;

-- Admin can read every profile, appointment and doctor (including inactive).
do $$ begin
  create policy profiles_admin_read     on public.profiles     for select using (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy appointments_admin_read on public.appointments for select using (public.is_admin());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy doctors_admin_read      on public.doctors      for select using (public.is_admin());
exception when duplicate_object then null; end $$;
