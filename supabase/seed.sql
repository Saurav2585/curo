-- Curo — seed data
-- Run after 0001_init.sql. Idempotent: safe to re-run.
--
-- Realistic on purpose. Long names, uneven fees, ragged ratings, partially booked
-- days. Placeholder data hides layout failures; this is here to expose them.

-- ---------------------------------------------------------------- specialties
insert into public.specialties (name, slug, icon, description) values
  ('General Physician', 'general-physician', 'stethoscope', 'Fever, infections, everyday health concerns'),
  ('Dermatology',       'dermatology',       'sparkles',    'Skin, hair and nail conditions'),
  ('Cardiology',        'cardiology',        'heart-pulse', 'Heart and circulatory care'),
  ('Paediatrics',       'paediatrics',       'baby',        'Newborn, child and adolescent health'),
  ('Orthopaedics',      'orthopaedics',      'bone',        'Bones, joints, spine and sports injuries'),
  ('Psychiatry',        'psychiatry',        'brain',       'Mental health, therapy and counselling')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------- clinics
insert into public.clinics (name, address_line, city, phone) values
  ('Sunrise Multispeciality Clinic', '14 Residency Road, Ashok Nagar',      'Bengaluru', '+91 80 4123 7788'),
  ('Harbourline Health Centre',      '2nd Floor, Linking Road, Bandra West', 'Mumbai',    '+91 22 2645 1190'),
  ('Meridian Family Practice',       'B-42 Greater Kailash Part I',          'New Delhi', '+91 11 4155 2020')
on conflict (name) do nothing;

-- ---------------------------------------------------------------- doctors
insert into public.doctors
  (slug, full_name, specialty_id, clinic_id, qualifications, experience_years,
   consultation_fee, languages, rating, review_count, bio)
select v.slug, v.full_name, s.id, c.id, v.qualifications, v.experience_years,
       v.fee, v.languages, v.rating, v.review_count, v.bio
from (values
  ('ananya-sharma',    'Dr. Ananya Sharma',        'general-physician', 'Sunrise Multispeciality Clinic', 'MBBS, MD (Internal Medicine)',        12, 600.00,  array['English','Hindi','Kannada'],       4.8, 312, 'Twelve years treating everyday illness with an emphasis on not over-prescribing. Special interest in managing diabetes and hypertension in people under forty.'),
  ('rajesh-iyer',      'Dr. Rajesh Iyer',          'cardiology',        'Sunrise Multispeciality Clinic', 'MBBS, MD, DM (Cardiology)',           21, 1500.00, array['English','Tamil','Hindi'],         4.9, 508, 'Interventional cardiologist. Runs a preventive cardiac screening programme for patients with a family history of heart disease.'),
  ('meera-nair',       'Dr. Meera Nair',           'dermatology',       'Sunrise Multispeciality Clinic', 'MBBS, MD (Dermatology)',               9, 900.00,  array['English','Malayalam','Hindi'],     4.7, 224, 'Medical and procedural dermatology. Known for talking patients out of treatments they do not need.'),
  ('vikram-deshpande', 'Dr. Vikram Deshpande',     'orthopaedics',      'Harbourline Health Centre',      'MBBS, MS (Orthopaedics)',             16, 1100.00, array['English','Marathi','Hindi'],       4.6, 189, 'Sports injuries and joint preservation. Works with three city running clubs on injury prevention.'),
  ('fatima-qureshi',   'Dr. Fatima Qureshi',       'paediatrics',       'Harbourline Health Centre',      'MBBS, DCH, MD (Paediatrics)',         14, 800.00,  array['English','Hindi','Urdu'],          4.9, 431, 'Newborn to adolescent care. Long consultations by design — most paediatric visits are as much about the parent as the child.'),
  ('sandeep-menon',    'Dr. Sandeep Menon',        'psychiatry',        'Harbourline Health Centre',      'MBBS, MD (Psychiatry)',               11, 1800.00, array['English','Malayalam'],             4.8, 146, 'Adult psychiatry with a focus on anxiety and burnout in high-pressure workplaces. Combines medication review with structured therapy.'),
  ('priya-balasubra',  'Dr. Priya Balasubramanian','general-physician', 'Meridian Family Practice',       'MBBS, DNB (Family Medicine)',          7, 550.00,  array['English','Tamil','Hindi'],         4.5, 97,  'Family medicine across all ages. Runs the clinic''s same-day sick visit slots.'),
  ('arjun-khanna',     'Dr. Arjun Khanna',         'dermatology',       'Meridian Family Practice',       'MBBS, MD (Dermatology), FRCP',        18, 1300.00, array['English','Hindi','Punjabi'],       4.7, 356, 'Complex skin disease and long-term management of psoriasis and eczema.'),
  ('leela-krishnan',   'Dr. Leela Krishnan',       'cardiology',        'Meridian Family Practice',       'MBBS, MD, DM (Cardiology)',           13, 1400.00, array['English','Tamil','Hindi'],         4.8, 271, 'Non-invasive cardiology and heart failure follow-up. Strong emphasis on lifestyle-first management.'),
  ('tarun-ghosh',      'Dr. Tarun Ghosh',          'orthopaedics',      'Sunrise Multispeciality Clinic', 'MBBS, MS (Orthopaedics), FRCS',       24, 1600.00, array['English','Bengali','Hindi'],       4.6, 402, 'Spine and joint replacement. Twenty-four years of practice; sees second-opinion cases from across the region.'),
  ('nisha-reddy',      'Dr. Nisha Reddy',          'paediatrics',       'Meridian Family Practice',       'MBBS, MD (Paediatrics)',               6, 700.00,  array['English','Telugu','Hindi'],        4.4, 63,  'General paediatrics and childhood nutrition. Newest member of the practice, with same-week availability.'),
  ('imran-shaikh',     'Dr. Imran Shaikh',         'psychiatry',        'Sunrise Multispeciality Clinic', 'MBBS, DPM, MD (Psychiatry)',          15, 1700.00, array['English','Hindi','Marathi','Urdu'], 4.7, 208, 'Adult and adolescent psychiatry. Particular interest in sleep disorders and their overlap with mood.')
) as v(slug, full_name, specialty_slug, clinic_name, qualifications, experience_years, fee, languages, rating, review_count, bio)
join public.specialties s on s.slug = v.specialty_slug
join public.clinics     c on c.name = v.clinic_name
on conflict (slug) do nothing;

-- ---------------------------------------------------------------- availability
-- Monday-Friday morning and evening sessions; Saturday morning only; no Sunday.
-- Slot length varies by specialty, which is what makes the grid look real:
-- a psychiatrist's 45-minute slots read very differently from a GP's 15.
insert into public.availability (doctor_id, weekday, start_time, end_time, slot_minutes)
select d.id, wd.weekday, sess.start_time, sess.end_time,
       case s.slug
         when 'psychiatry'        then 45
         when 'cardiology'        then 30
         when 'orthopaedics'      then 30
         when 'paediatrics'       then 20
         when 'dermatology'       then 20
         else 15
       end
from public.doctors d
join public.specialties s on s.id = d.specialty_id
cross join (values (1), (2), (3), (4), (5), (6)) as wd(weekday)
cross join lateral (
  values
    ('09:00'::time, '13:00'::time),
    ('17:00'::time, '20:00'::time)
) as sess(start_time, end_time)
where not (wd.weekday = 6 and sess.start_time = '17:00')   -- Saturday mornings only
on conflict (doctor_id, weekday, start_time) do nothing;

-- ---------------------------------------------------------------- time off
-- time_off has no natural unique key, so guard on existence to stay re-runnable.
insert into public.time_off (doctor_id, starts_at, ends_at, reason)
select d.id,
       (current_date + 2 + time '09:00') at time zone 'Asia/Kolkata',
       (current_date + 2 + time '13:00') at time zone 'Asia/Kolkata',
       'Conference'
from public.doctors d
where d.slug = 'rajesh-iyer'
  and not exists (select 1 from public.time_off t where t.doctor_id = d.id and t.reason = 'Conference');

insert into public.time_off (doctor_id, starts_at, ends_at, reason)
select d.id,
       (current_date + 1 + time '17:00') at time zone 'Asia/Kolkata',
       (current_date + 1 + time '20:00') at time zone 'Asia/Kolkata',
       'Surgery list'
from public.doctors d
where d.slug = 'tarun-ghosh'
  and not exists (select 1 from public.time_off t where t.doctor_id = d.id and t.reason = 'Surgery list');

-- ---------------------------------------------------------------- bookings
-- Fills a realistic share of each doctor's next few days so the grid is never
-- an empty wall of teal, and the doctor dashboard has data on first login.
-- Uses get_available_slots() so every seeded booking lands on a legitimate slot.
with candidate as (
  select d.id as doctor_id,
         s.slot_start,
         s.slot_end,
         row_number() over (partition by d.id, s.slot_start::date order by s.slot_start) as rn
  from public.doctors d
  cross join generate_series(current_date, current_date + 6, '1 day'::interval) g
  cross join lateral public.get_available_slots(d.id, g::date) s
  where s.status = 'available'
),
picked as (
  -- Deterministic scatter: keeps roughly 45% of slots taken without randomness,
  -- so the demo looks identical on every reseed.
  select * from candidate where rn % 7 in (0, 1, 3, 4)
),
names as (
  -- WITH ORDINALITY rather than two set-returning functions in one select list:
  -- the pairing is then guaranteed rather than dependent on lockstep evaluation.
  select n.full_name, n.idx
  from unnest(array[
    'Rohan Mehta','Kavya Subramanian','Aditya Bose','Sneha Kulkarni','Farhan Ali',
    'Divya Ramesh','Nikhil Chatterjee','Ishaan Gupta','Radhika Pillai','Yash Trivedi',
    'Ayesha Siddiqui','Manav Joshi','Tara D''Souza','Vivek Anand','Shruti Rao'
  ]) with ordinality as n(full_name, idx)
)
insert into public.appointments
  (doctor_id, patient_name, patient_phone, starts_at, ends_at, status, reason)
select p.doctor_id,
       n.full_name,
       '+91 98' || lpad(((p.rn * 7919) % 100000000)::text, 8, '0'),
       p.slot_start,
       p.slot_end,
       'booked',
       (array['Follow-up','New complaint','Routine check','Report review','Second opinion'])
         [1 + (p.rn % 5)]
from picked p
join names n on n.idx = 1 + (p.rn % 15)
on conflict do nothing;

-- ---------------------------------------------------------------- verify
do $$
declare
  v_doctors int; v_slots int; v_booked int;
begin
  select count(*) into v_doctors from public.doctors;
  select count(*) into v_booked  from public.appointments where status = 'booked';
  select count(*) into v_slots
  from public.doctors d
  cross join lateral public.get_available_slots(d.id, current_date + 1) s;

  raise notice 'Seed complete: % doctors, % slots tomorrow, % appointments booked',
    v_doctors, v_slots, v_booked;
end $$;
