-- Curo — doctor dashboard support
-- Run in Supabase Studio → SQL Editor after 0002_next_slots.sql.
--
-- Two functions the doctor dashboard needs, plus a convenience for claiming a
-- seeded doctor profile with your own login so you can demo the doctor side.

-- ---------------------------------------------------------------- day KPIs
-- One row of headline numbers for a doctor's day. Computed, so it's always true.
create or replace function public.doctor_day_stats(p_doctor_id uuid, p_date date)
returns table (
  booked_today     int,
  capacity_today   int,
  utilisation_pct  int,
  cancelled_today  int,
  week_booked      int
)
language sql
stable
security definer
set search_path = public
as $$
  with today_slots as (
    select status from public.get_available_slots(p_doctor_id, p_date)
  ),
  booked as (
    select count(*)::int n from today_slots where status = 'booked'
  ),
  capacity as (
    -- every slot that could be sold today = available + booked (exclude past/off)
    select count(*)::int n from today_slots where status in ('available', 'booked')
  ),
  cancelled as (
    select count(*)::int n
    from public.appointments
    where doctor_id = p_doctor_id
      and status = 'cancelled'
      and (starts_at at time zone 'Asia/Kolkata')::date = p_date
  ),
  weekc as (
    select count(*)::int n
    from public.appointments
    where doctor_id = p_doctor_id
      and status = 'booked'
      and (starts_at at time zone 'Asia/Kolkata')::date
          between p_date and p_date + 6
  )
  select
    booked.n,
    capacity.n,
    case when capacity.n > 0
         then round(100.0 * booked.n / capacity.n)::int
         else 0 end,
    cancelled.n,
    weekc.n
  from booked, capacity, cancelled, weekc;
$$;

grant execute on function public.doctor_day_stats(uuid, date) to authenticated;

-- ---------------------------------------------------------------- claim a profile
-- Demo helper: links the signed-in user to a seeded doctor by slug and flips
-- their role to 'doctor'. Lets you experience the doctor side without inventing
-- a separate seeded login. security definer so it can update rows the caller
-- couldn't otherwise touch — but it only ever acts on auth.uid(), so a user can
-- only ever claim FOR THEMSELVES.
create or replace function public.claim_doctor_profile(p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Must be signed in to claim a doctor profile';
  end if;

  update public.profiles set role = 'doctor' where id = v_uid;

  update public.doctors
     set profile_id = v_uid
   where slug = p_slug;
end $$;

grant execute on function public.claim_doctor_profile(text) to authenticated;
