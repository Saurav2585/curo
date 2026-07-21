-- Curo — schema verification
-- Run in Supabase Studio → SQL Editor AFTER 0001_init.sql and seed.sql.
-- Every check raises on failure, so a clean run means the foundation is sound.
-- Takes about two seconds. Do this before writing a single line of app code.

do $$
declare
  v_count      int;
  v_doctor     uuid;
  v_slot       timestamptz;
  v_slot_end   timestamptz;
  v_overflow   int;
  v_err        text;
begin
  raise notice '--- Curo schema verification ---';

  -- 1. Catalogue seeded
  select count(*) into v_count from public.specialties;
  if v_count <> 6 then raise exception 'FAIL: expected 6 specialties, found %', v_count; end if;
  raise notice 'PASS  specialties seeded (%)', v_count;

  select count(*) into v_count from public.doctors;
  if v_count <> 12 then raise exception 'FAIL: expected 12 doctors, found %', v_count; end if;
  raise notice 'PASS  doctors seeded (%)', v_count;

  -- 2. Availability covers Mon-Sat, with no Sunday rules
  select count(*) into v_count from public.availability where weekday = 0;
  if v_count <> 0 then raise exception 'FAIL: Sunday availability exists (% rows)', v_count; end if;
  raise notice 'PASS  no Sunday availability';

  -- 3. Slot generation returns slots for a working day
  select id into v_doctor from public.doctors where slug = 'ananya-sharma';
  select count(*) into v_count
  from public.get_available_slots(v_doctor, (current_date + 1)::date);
  if v_count = 0 then raise exception 'FAIL: no slots generated for tomorrow'; end if;
  raise notice 'PASS  slot generation (% slots tomorrow)', v_count;

  -- 4. No generated slot may run past its session end.
  --    This is the bug the floor() in get_available_slots exists to prevent.
  select count(*) into v_overflow
  from public.doctors d
  join public.availability a
    on a.doctor_id = d.id
  cross join lateral public.get_available_slots(d.id, (current_date + 1)::date) s
  where a.weekday = extract(dow from current_date + 1)::smallint
    and (s.slot_end at time zone 'Asia/Kolkata')::time > a.end_time
    and (s.slot_start at time zone 'Asia/Kolkata')::time >= a.start_time
    and (s.slot_start at time zone 'Asia/Kolkata')::time <  a.end_time;
  if v_overflow > 0 then
    raise exception 'FAIL: % slot(s) overflow their session end_time', v_overflow;
  end if;
  raise notice 'PASS  no slot overflows its session';

  -- 5. Time off removes slots
  select count(*) into v_count
  from public.doctors d
  cross join lateral public.get_available_slots(d.id, (current_date + 2)::date) s
  where d.slug = 'rajesh-iyer' and s.status = 'unavailable';
  if v_count = 0 then raise exception 'FAIL: time_off did not mark any slot unavailable'; end if;
  raise notice 'PASS  time off blocks slots (% marked unavailable)', v_count;

  -- 6. Seeded bookings show as booked
  select count(*) into v_count
  from public.doctors d
  cross join lateral public.get_available_slots(d.id, (current_date + 1)::date) s
  where s.status = 'booked';
  if v_count = 0 then raise exception 'FAIL: no booked slots — seed did not take'; end if;
  raise notice 'PASS  bookings reflected in grid (% booked tomorrow)', v_count;

  -- 7. next_available_slots works
  select count(*) into v_count from public.next_available_slots(v_doctor, 3);
  if v_count <> 3 then raise exception 'FAIL: next_available_slots returned %, expected 3', v_count; end if;
  raise notice 'PASS  next available lookup';

  -- 8. THE double-booking test.
  --    Take a free slot, book it, then try to book it again. The second insert
  --    MUST fail on appointments_no_double_book. If it succeeds, the core promise
  --    of the product is broken and nothing else matters.
  select s.slot_start, s.slot_end into v_slot, v_slot_end
  from public.get_available_slots(v_doctor, (current_date + 1)::date) s
  where s.status = 'available'
  order by s.slot_start
  limit 1;

  insert into public.appointments (doctor_id, patient_name, starts_at, ends_at, reason)
  values (v_doctor, 'Verification Patient A', v_slot, v_slot_end, 'concurrency test');

  begin
    insert into public.appointments (doctor_id, patient_name, starts_at, ends_at, reason)
    values (v_doctor, 'Verification Patient B', v_slot, v_slot_end, 'concurrency test');
    raise exception 'FAIL: DOUBLE BOOKING SUCCEEDED — the unique index is not working';
  exception
    when unique_violation then
      raise notice 'PASS  double booking rejected by the database';
  end;

  -- 9. Cancelling frees the slot again (partial index drops cancelled rows)
  update public.appointments
     set status = 'cancelled', cancelled_at = now()
   where reason = 'concurrency test';

  select count(*) into v_count
  from public.get_available_slots(v_doctor, (current_date + 1)::date) s
  where s.slot_start = v_slot and s.status = 'available';
  if v_count <> 1 then raise exception 'FAIL: cancelled slot did not return to available'; end if;
  raise notice 'PASS  cancellation frees the slot';

  -- cleanup
  delete from public.appointments where reason = 'concurrency test';

  raise notice '--- ALL CHECKS PASSED ---';
end $$;
