-- Curo — review & reputation foundation
-- Additive. Eligibility is enforced at the DATABASE: a review can only be
-- inserted for the patient's OWN, COMPLETED appointment with that doctor, and
-- only once per appointment. Public reads see only published reviews.
--
-- Does NOT touch doctors.rating (seeded demo data stays intact); reputation is
-- computed separately from these rows. Run after 0012_visibility_ranking.sql.

do $$ begin
  create type review_status as enum ('published', 'hidden', 'reported', 'pending_review');
exception when duplicate_object then null; end $$;

create table if not exists public.reviews (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  doctor_id      uuid not null references public.doctors(id) on delete cascade,
  patient_id     uuid not null references public.profiles(id) on delete cascade,

  -- ratings (overall required; dimensions optional)
  overall           smallint not null check (overall between 1 and 5),
  bedside_manner    smallint check (bedside_manner between 1 and 5),
  communication     smallint check (communication between 1 and 5),
  wait_time         smallint check (wait_time between 1 and 5),
  clinic_experience smallint check (clinic_experience between 1 and 5),
  recommend         boolean not null default true,

  title          text,
  comment        text,
  anonymous      boolean not null default false,
  -- Display name snapshot at submit time (null when anonymous). Snapshotting
  -- keeps the profiles table private — published reviews are world-readable but
  -- profiles are not, so we cannot join to them for public display.
  reviewer_name  text,
  verified_visit boolean not null default true,

  status         review_status not null default 'published',
  created_at     timestamptz not null default now(),
  edited_at      timestamptz
);

create index if not exists reviews_doctor_idx on public.reviews (doctor_id, status, created_at desc);

alter table public.reviews enable row level security;

-- Anyone may read PUBLISHED reviews.
drop policy if exists reviews_read_published on public.reviews;
create policy reviews_read_published on public.reviews
  for select using (status = 'published');

-- A patient may read their own reviews regardless of status.
drop policy if exists reviews_read_own on public.reviews;
create policy reviews_read_own on public.reviews
  for select using (auth.uid() = patient_id);

-- INSERT eligibility — the central rule, enforced here:
--   • the review is by the signed-in patient, and
--   • it references THAT patient's appointment with THAT doctor, and
--   • the appointment status is 'completed'.
-- Cancelled, future (booked), or unrelated appointments cannot be reviewed.
drop policy if exists reviews_insert_eligible on public.reviews;
create policy reviews_insert_eligible on public.reviews
  for insert with check (
    auth.uid() = patient_id
    and exists (
      select 1 from public.appointments a
      where a.id = reviews.appointment_id
        and a.patient_id = auth.uid()
        and a.doctor_id = reviews.doctor_id
        and a.status = 'completed'
    )
  );

-- A patient may edit or remove their own review.
drop policy if exists reviews_update_own on public.reviews;
create policy reviews_update_own on public.reviews
  for update using (auth.uid() = patient_id) with check (auth.uid() = patient_id);

drop policy if exists reviews_delete_own on public.reviews;
create policy reviews_delete_own on public.reviews
  for delete using (auth.uid() = patient_id);

-- Admin: full access (moderation tooling comes later; the states already exist).
drop policy if exists reviews_admin_all on public.reviews;
create policy reviews_admin_all on public.reviews
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
