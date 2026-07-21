# Curo — Screen Inventory

Thirteen screens × five states. **No blank cells.** This table is the build checklist on Wednesday and Thursday, and the QA checklist on Friday. If a state isn't in here, it doesn't get built; if it's in here and isn't built, the screen isn't done.

---

## Patient — discovery

### 1. `/` Home & search
*Purpose: get the patient into a specialty + city + date search in one screen.*

| State | Design |
|---|---|
| **Empty** | Never empty — six specialty tiles and "Available today" are always seeded content. |
| **Loading** | Specialty tiles as skeleton chips; search bar interactive immediately. |
| **Partial** | City detection fails → city field falls back to a manual select, no blocking error. |
| **Ideal** | Search bar (specialty, city, date), six specialty tiles, "12 doctors available today" live count. |
| **Error** | Specialty list fails to load → tiles replaced by a plain select and an inline "Couldn't load specialties. Retry." |

### 2. `/doctors` Results
*Purpose: narrow to bookable doctors, showing next availability on the card.*

| State | Design |
|---|---|
| **Empty** | "No doctors match these filters." Shows the two filters most likely at fault with one-tap clear, plus 3 nearest-match doctors below. |
| **Loading** | Six card skeletons preserving final card height — no layout shift. |
| **Partial** | Doctors load, next-slot lookup still pending → card renders with "Checking availability…" in the slot row only. |
| **Ideal** | Filter rail (specialty, city, date, fee, language), sorted cards each showing photo, name, specialty, experience, fee, and next three open slots as tappable chips. |
| **Error** | Query fails → full-width inline error with Retry; filters stay set so nothing is lost. |

### 3. `/doctors/[slug]` Doctor profile
*Purpose: build enough trust to commit, then hand off to the grid.*

| State | Design |
|---|---|
| **Empty** | Doctor has no availability configured → profile renders fully, booking panel says "Not accepting online bookings" with the clinic phone number. |
| **Loading** | Header skeleton, then bio; sticky booking panel loads independently. |
| **Partial** | Bio and credentials shown, slot panel still loading its own skeleton. |
| **Ideal** | Header (photo, name, specialty, rating, experience, fee), about, qualifications, languages, clinic address, sticky "Book appointment" panel with next available date. |
| **Error** | 404 for unknown slug → "This doctor isn't listed" with a link back to results for the same specialty. |

---

## Patient — booking

### 4. `/doctors/[slug]/book` Slot grid — **the signature screen**
*Purpose: read a whole day at a glance, commit in one tap.*

| State | Design |
|---|---|
| **Empty** | Selected date is a non-working day → "Dr Sharma doesn't consult on Sundays" plus the next three working dates as buttons. |
| **Loading** | Date strip renders instantly; slot area shows a grid of skeleton chips at final dimensions. |
| **Partial** | All slots on the chosen date are taken → every chip greyed with "Fully booked" and the next available date surfaced as the primary action. |
| **Ideal** | Horizontal date strip (14 days), slots grouped Morning / Afternoon / Evening, three-state chips — available (teal outline), filling fast (amber, when under 30% of the session remains), booked (neutral, non-interactive). Legend always visible. Selected chip solid teal. |
| **Error** | Slot fetch fails → "Couldn't load times" with Retry, date strip stays usable. |

### 5. `/doctors/[slug]/book` (step 2) Patient details
*Purpose: collect the minimum needed to hold the slot.*

| State | Design |
|---|---|
| **Empty** | First-time patient, no saved profile → blank form with name, phone, reason for visit. |
| **Loading** | Submit button enters loading state; selected slot summary stays pinned and visible. |
| **Partial** | Signed-in patient → name and phone prefilled and editable, only reason for visit is empty. |
| **Ideal** | Slot summary card (doctor, date, time, fee), three fields, clear primary CTA. Auth deferred to here, never before the slot is picked. |
| **Error** | Two flavours, deliberately distinct: field validation inline under each input; **slot taken during the flow** → amber banner "That 10:30 slot was just booked. Here are the nearest times." with three alternatives, form state preserved. |

### 6. `/bookings/[id]` Confirmation
*Purpose: prove it's real and make it easy to keep.*

| State | Design |
|---|---|
| **Empty** | N/A — a confirmation always has a booking. Unknown id falls to the error state. |
| **Loading** | Skeleton card; never a spinner on a page the patient waited for. |
| **Partial** | Booking confirmed but the email send failed → success card intact, quiet note "We couldn't email your confirmation. Your reference is CU-3F8A21." |
| **Ideal** | Green confirmation card, booking reference, doctor, date/time, clinic address with map link, fee and "pay at clinic", add-to-calendar, cancel/reschedule links. |
| **Error** | Unknown or unauthorised id → "We couldn't find that booking" with a link to `/bookings`. |

---

## Patient — account

### 7. `/bookings` My bookings

| State | Design |
|---|---|
| **Empty** | Illustration, "No appointments yet", primary CTA "Find a doctor". |
| **Loading** | Three row skeletons. |
| **Partial** | Upcoming section populated, past section still loading below. |
| **Ideal** | Upcoming and Past sections; each row shows doctor, specialty, date/time, status badge, and cancel/reschedule on upcoming only. |
| **Error** | Inline error with Retry, preserving section tabs. |

### 8. `/account` Account

| State | Design |
|---|---|
| **Empty** | New account → name and phone empty with a "Complete your profile" nudge that speeds up future bookings. |
| **Loading** | Field skeletons. |
| **Partial** | Profile saved but phone unverified → inline badge, non-blocking. |
| **Ideal** | Name, phone, email (read-only), avatar, sign out. |
| **Error** | Save fails → toast "Couldn't save changes", form keeps the user's edits. |

### 9. `/sign-in` · `/sign-up` Auth

| State | Design |
|---|---|
| **Empty** | Default — blank email/password plus Google button. |
| **Loading** | Button spinner, inputs disabled. |
| **Partial** | OAuth returned but profile row not yet created → brief "Setting up your account…" interstitial. |
| **Ideal** | Email + password, Google OAuth, link to the opposite mode. If arriving mid-booking, a banner reads "Your 10:30 slot is held while you sign in." |
| **Error** | Wrong credentials → inline, non-alarming, with a password reset link. Rate-limited → "Too many attempts, try again in a minute." |

---

## Doctor side

### 10. `/dashboard` Doctor dashboard

| State | Design |
|---|---|
| **Empty** | No appointments today → "Nothing booked today" with the week's total and a link to the schedule editor. |
| **Loading** | KPI cards skeleton, then table skeleton. |
| **Partial** | KPIs resolved, appointment table still loading — KPIs must never wait on the table. |
| **Ideal** | Four KPIs (today's appointments, week total, utilisation %, cancellations) with deltas, then today's schedule as a time-ordered table. Tabular figures, right-aligned numerics. |
| **Error** | KPI cards show an em-dash rather than zero — a failed load must never read as real data. |

### 11. `/dashboard/appointments` Appointments

| State | Design |
|---|---|
| **Empty** | "No appointments in this range" with a reset-filter action. |
| **Loading** | Table skeleton, eight rows. |
| **Partial** | First page rendered, pagination pending. |
| **Ideal** | Filterable table (date range, status), columns: time, patient, reason, status, actions. Bulk select for marking complete. |
| **Error** | Row-level failure marks only that row, table stays usable. |

### 12. `/dashboard/schedule` Availability editor

| State | Design |
|---|---|
| **Empty** | No rules set → weekly grid empty with "Add your consulting hours" and a suggested 9–1 / 5–8 default. |
| **Loading** | Grid skeleton. |
| **Partial** | Some weekdays configured, others blank — blanks read as "Not consulting", not as broken. |
| **Ideal** | Week grid, per-day time ranges, slot duration selector, time-off block, live preview of generated slots. |
| **Error** | Overlapping or invalid range → inline error on the offending row, save blocked with the reason stated. |

### 13. `/pricing` Clinic plans

| State | Design |
|---|---|
| **Empty** | N/A — static content. |
| **Loading** | N/A — server rendered. |
| **Partial** | Signed-in clinic sees its current plan marked "Your plan". |
| **Ideal** | Three tiers (Solo / Practice / Hospital), middle tier highlighted as popular, outcome-led feature rows, honest annual discount, visible downgrade path. |
| **Error** | N/A. |

---

## Cross-cutting rules

- **Skeletons, never spinners**, on anything above the fold. Spinners are permitted only inside buttons.
- **Optimistic slot selection** — the chip fills the moment it's tapped; reconciliation happens behind it.
- **Every error names the next action.** "Something went wrong" is not shipped anywhere in this app.
- **Empty states carry a CTA**, never a dead end.
- **The slot grid never relies on colour alone** — state is carried by colour, border weight, and a label, so it survives colour blindness and greyscale printing.
