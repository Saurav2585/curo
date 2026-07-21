-- Curo — batched next-available lookup
-- Run in Supabase Studio → SQL Editor after 0001_init.sql.
--
-- The results page shows the next three open slots on every doctor card.
-- Calling next_available_slots() once per doctor would be a round trip each;
-- this does the whole page in one.

create or replace function public.doctors_next_slots(
  p_doctor_ids uuid[],
  p_limit int default 3
)
returns table (doctor_id uuid, slot_start timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select d.id as doctor_id, s.slot_start
  from unnest(p_doctor_ids) as d(id)
  cross join lateral (
    select gs.slot_start
    from generate_series(current_date, current_date + 13, '1 day'::interval) g
    cross join lateral public.get_available_slots(d.id, g::date) gs
    where gs.status = 'available'
    order by gs.slot_start
    limit p_limit
  ) s;
$$;

grant execute on function public.doctors_next_slots(uuid[], int) to anon, authenticated;
