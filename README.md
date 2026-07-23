# Curo

**Doctor appointment booking. BookMyShow, for healthcare.**

A patient finds the right doctor and locks a real appointment slot in under 90 seconds. The signature screen is a live slot grid — a doctor's day read at a glance, with three unmistakable states: available, filling fast, booked.

Built as a demo project against the *SaaS Product Design with AI* brief, using only free-tier tooling.

---

## Where things are

```
docs/design-brief.md       One page. Nothing downstream may contradict it.
docs/screen-inventory.md   13 screens x 5 states. The build and QA checklist.
design/tokens.json         Primitives -> semantic -> component. Single source of truth.
scripts/build-tokens.mjs   tokens.json -> app/globals.css
scripts/check-contrast.py  Asserts WCAG 2.2 AA on every token pair. CI gate.
supabase/migrations/       Schema, RLS, slot engine.
supabase/seed.sql          12 doctors, realistic availability, ~45% booked.
supabase/verify.sql        Nine assertions, including a live double-booking test.
```

---

## Setup — about 15 minutes

### 1. Accounts (all free, no card)

- [GitHub](https://github.com) — repo
- [Supabase](https://supabase.com) — Postgres + auth, free tier
- [Vercel](https://vercel.com) — hosting, Hobby tier

### 2. Database

In Supabase Studio → **SQL Editor**, run in order:

1. `supabase/migrations/0001_init.sql`
2. `supabase/seed.sql`
3. `supabase/verify.sql` ← **do not skip**

`verify.sql` must end with `--- ALL CHECKS PASSED ---`. If it doesn't, fix the schema before writing any app code. Chasing a slot-generation bug through React components on Thursday night is how this deadline gets missed.

### 3. App

```bash
npx create-next-app@latest curo --typescript --tailwind --app --eslint
cd curo
npm i @supabase/supabase-js @supabase/ssr lucide-react date-fns
node scripts/build-tokens.mjs      # writes app/globals.css
```

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Deploy on day one

Push to GitHub, import into Vercel, add the two env vars, deploy. **Do this before building features.** Deployment problems discovered on Friday morning are the single most common way a three-day demo dies.

---

## Demo access (for reviewers)

The app has two sides. You can explore the patient side with no account at all —
search, compare doctors, and view live availability freely; you only sign in at
the moment you confirm a booking.

To see both sides:

| Role | How to get in |
|---|---|
| **Patient** | Sign up with any email on `/sign-up`, or just browse `/doctors` without an account and book — you'll be asked to sign in only at the final confirm step. |
| **Doctor portal** | Sign in at `/sign-in` with **`doctor@curo.demo`** / **`CuroDemo123`**, then open `/dashboard`. You'll see Dr. Ananya Sharma's live schedule, today's KPIs, appointments, and consulting hours. |

The doctor and patient views read the **same database** — a booking made as a
patient appears instantly on the doctor's dashboard, because there is no synced
copy, only one source of truth.

> Note: email confirmation is disabled on the demo project so accounts are
> usable immediately.

## The two decisions that carry the build

**Slots are computed, never stored.** `get_available_slots(doctor_id, date)` derives every slot from availability rules, minus time off, minus booked appointments. There is no slot table, no nightly job, and nothing that can fall out of sync. Change a doctor's hours and the grid is correct on the next query.

**Double-booking is impossible, not unlikely.**

```sql
create unique index appointments_no_double_book
  on public.appointments (doctor_id, starts_at)
  where status = 'booked';
```

A partial unique index. Two patients racing for the same 10:30 — one wins, the other gets a friendly "that slot was just taken, here are the nearest times" with their form state preserved. Cancelled rows drop out of the index, so cancelling frees the slot automatically. `verify.sql` proves both behaviours.

---

## Design system

Tokens are the only source of colour, spacing and type. No component references a raw hex.

Palette is **Teal Trust** — deep teal `#028090`, seafoam, mint — deliberately not the default healthcare blue. The slot grid carries state through colour *and* border weight *and* a text label, so it survives colour blindness and greyscale.

Contrast is asserted at generation, not audited afterwards:

```bash
python3 scripts/check-contrast.py    # 47 pairs, exits non-zero on failure
```

This caught five real failures on the first run — two border tokens too light for WCAG 1.4.11, and a booked-slot label at 4.12:1. All fixed at the token level.

---

## Schedule

| | |
|---|---|
| Tue evening | Brief, screen inventory, tokens, schema ✅ |
| Wednesday | Repo, auth, app shell, search, doctor profile, **deploy** |
| Thursday | Slot grid, booking flow, confirmation, doctor dashboard |
| Friday am | Five states, a11y, E2E, polish, final deploy |

**Feature freeze is Thursday night.** Friday is verification and deployment only. If time runs short, cut in this order: confirmation email → reschedule → availability editor.

---

## Out of scope

Payments, video consults, prescriptions, review writing, lab orders, insurance, notifications beyond booking confirmation, multi-language.

A demo is judged on how well one flow is executed. This one executes booking.
