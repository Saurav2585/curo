# Curo — Project Context Brief

*Paste this into any AI assistant so it understands the project in full before helping.*

---

## 1. What Curo is

Curo is a **doctor appointment booking web app** — think "BookMyShow for healthcare".
A patient finds the right doctor and locks a **real, confirmed appointment slot in under
a minute**. Built as a demo project, deployed and functional, using only free-tier tooling.

**The signature idea:** a doctor's day is shown as a **live slot grid** — a cinema-style
seat map with three states: *available*, *filling fast*, and *booked*. The patient reads
the whole day at a glance and books in one tap.

**The core differentiator (the "why"):** competitors (Practo, Zocdoc, Apollo 24|7) keep a
*stale copy* of each doctor's calendar, so "confirmed" bookings bounce, times are wrong, and
no-shows pile up. Curo has **no synced copy** — every slot is *computed live* from the
doctor's own availability rules, and a booking is written straight to the one source of
truth. A booking is confirmed the instant it's written, and a **database-level constraint
makes double-booking impossible**.

## 2. Two sides / roles

- **Patient** — search doctors by specialty/city/name, view a profile, open the slot grid,
  pick a time, confirm (sign in only at this final step), manage bookings (view / cancel).
- **Doctor** — a portal (`/dashboard`) showing today's KPIs, today's schedule, all
  appointments (filterable), and read-only consulting hours + time off.
- Roles: `patient`, `doctor`, `admin` (enforced by Postgres Row-Level Security).

## 3. Tech stack (all free tier, no credit card)

| Layer | Choice |
|---|---|
| Framework | **Next.js 15**, App Router, TypeScript (strict), React Server Components |
| Styling | **Tailwind CSS v4** + a custom token system (see §6) |
| Icons | lucide-react · Font: Inter |
| Database | **Supabase Postgres** (free tier) |
| Auth | **Supabase Auth** (email + password; email confirmation disabled for the demo) |
| Data access | `@supabase/ssr` + `@supabase/supabase-js` (server & browser clients) |
| Hosting | **Vercel** (Hobby), auto-deploys from GitHub `main` |
| Repo | GitHub `Saurav2585/curo` |
| Live URL | `https://curo-phi.vercel.app` |

No ORM — SQL migrations live in `/supabase`. No Stripe/payments (bookings are pay-at-clinic).

## 4. Data model (Postgres, `public` schema)

```
profiles      id (→ auth.users) · role · full_name · phone · avatar_url
specialties   id · name · slug · icon · description
clinics       id · name · address_line · city · phone
doctors       id · profile_id (nullable) · specialty_id · clinic_id · slug · full_name
              · bio · qualifications · experience_years · consultation_fee · languages[]
              · rating · review_count · is_active
availability  id · doctor_id · weekday(0-6) · start_time · end_time · slot_minutes
time_off      id · doctor_id · starts_at · ends_at · reason
appointments  id · reference(CU-XXXXXX) · doctor_id · patient_id(nullable) · patient_name
              · patient_phone · starts_at · ends_at · status(booked|completed|cancelled|no_show)
              · reason · created_at · cancelled_at
```

**Two decisions that carry the whole build:**

1. **Slots are computed, never stored.** A SQL function `get_available_slots(doctor_id, date)`
   derives every slot from `availability` minus `time_off` minus booked `appointments`.
   No slot table, no cron, nothing to fall out of sync. Timezone is `Asia/Kolkata`.
2. **Double-booking is impossible at the database:**
   `CREATE UNIQUE INDEX ... ON appointments (doctor_id, starts_at) WHERE status = 'booked'`.
   Two racing patients → one wins, the other gets a friendly "just taken, here are the
   nearest times" (Postgres error `23505` handled in the booking action). Cancelling flips
   status to `cancelled`, which drops the row out of the partial index and frees the slot.

Other SQL functions: `next_available_slots`, `doctors_next_slots` (batched for the results
page), `doctor_day_stats` (dashboard KPIs), `claim_doctor_profile` (demo helper).

RLS: public catalogue readable by all; patients read only their own appointments; doctors
read only their own column of the calendar.

## 5. Routes / screens

```
/                       Marketing home (hero with a live slot-grid mockup, features, FAQ)
/doctors                Search results — filter by specialty/city + name search; availability on each card
/doctors/[slug]         Doctor profile with sticky booking panel
/doctors/[slug]/book    THE slot grid — date strip + Morning/Afternoon/Evening + 3-state chips
/doctors/[slug]/book/confirm   Patient details + the insert against the double-book index
/bookings               Patient's bookings (upcoming / past, cancel)
/bookings/[id]          Confirmation (reference, add-to-calendar, cancel)
/sign-in · /sign-up     Auth (auth deferred until the slot is chosen)
/pricing                Clinic plans (Solo / Practice / Hospital), middle tier anchored
/dashboard              Doctor overview: KPIs + today's schedule
/dashboard/appointments Filterable appointments table
/dashboard/schedule     Read-only consulting hours + time off
```

Every screen is designed in all five UI states where relevant: empty, loading (skeletons,
not spinners), partial, ideal, error. Every error names the next action.

## 6. Design system

- **Tokens** live in `design/tokens.json` (primitives → semantic → component). A build
  script (`scripts/build-tokens.mjs`) generates `app/globals.css` as CSS custom properties.
  Components reference only `var(--…)`, never raw hex.
- **Palette:** "Teal Trust" — primary teal `#028090`, neutral ramp 50–950, semantic
  success/warn/danger. Deliberately **not** the default healthcare blue.
- **Slot states carry meaning by colour AND border weight AND label** (survives colour
  blindness / greyscale).
- **Type scale** (one modular scale): `.t-display / t-h1 / t-h2 / t-h3 / t-lead / t-body /
  t-small / t-micro`, roughly 12·14·16·20·24·32·48.
- **Aesthetic direction:** restrained & premium (Linear / Stripe / Vercel) — neutral-
  dominant, ONE teal accent used only where it means something, crisp 1px borders, generous
  whitespace, subtle motion (scroll-reveal, hover lift), tabular figures on all numbers.
- **Accessibility:** WCAG 2.2 AA proven on every token pair by a script
  (`scripts/check-contrast.py`); visible focus rings; `prefers-reduced-motion` respected.

## 7. Current state

**Complete and deployed.** Full patient journey (search → profile → slot grid → auth →
booking with the double-booking guarantee → confirmation → my-bookings) and full doctor
portal (dashboard → appointments → schedule). Home page and dashboard have had a
restrained "premium SaaS" visual redesign. Favicon, promo banner, and a "Doctor login"
footer link are in.

**Demo access:** patient side needs no account (browse freely, sign in only to confirm).
Doctor portal: sign in as `doctor@curo.demo` / `CuroDemo123`, then open `/dashboard`.

**Not in scope (deliberately):** payments, video consults, prescriptions, patient reviews,
lab tests, insurance, notifications beyond booking confirmation, multi-language.

## 8. How to run locally

```bash
cd curo
npm install
npm run dev        # → http://localhost:3000
```

Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
SQL migrations in `/supabase` are applied via the Supabase SQL editor.

## 9. Conventions to respect when changing code

- Presentation changes only unless asked otherwise — never alter business logic, API calls,
  RLS, schema, routing, or validation to achieve a visual goal.
- All colour/spacing/type comes from tokens; regenerate `globals.css` with
  `node scripts/build-tokens.mjs` after editing `tokens.json`.
- `npm run build` (not just `dev`) is what typechecks — run it before every commit/push.
- Times render in `Asia/Kolkata`, always; the server runs in UTC.
