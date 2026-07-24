# Curo — Launch-Readiness Audit

*A complete product-logic, UX, information-architecture and commercial-readiness review, conducted before any monetisation work. No code was changed. Findings are grounded in the actual codebase as built.*

Reviewed as: Product Manager · Principal UX Architect · Healthcare SaaS Consultant · QA Lead · Information Architect.

---

## Executive summary

Curo is an **excellent MVP with a genuinely differentiated core** (live computed slots, database-enforced no-double-booking). The patient booking journey is polished and commercially credible. However, it is **not yet a launchable two-sided commercial product**, for three structural reasons:

1. **There is no way for a doctor or clinic to onboard themselves.** The entire supply side is created by hand (SQL). A marketplace with no supply-side signup cannot launch.
2. **The doctor side is read-only.** Doctors cannot edit their own availability, mark appointments done, or manage their day — yet "the doctor's schedule is the source of truth" is the product's central promise.
3. **The confirmation is silent.** No email or SMS is ever sent. The product's headline value — *reliable, confirmed appointments* — is undermined if the patient leaves with only an on-screen message.

None of these require a redesign. They are missing flows, not broken ones. This report enumerates every gap by severity so they can be sequenced before subscription work begins.

**Readiness scorecard**

| Area | State |
|---|---|
| Patient booking journey | ✅ Launch-ready |
| Visual design & IA | ✅ Strong |
| Role-based access & auth guards | ✅ Sound |
| Password reset | ⚠️ Half-built (no reset-completion page) |
| Doctor/clinic onboarding | ❌ Missing entirely |
| Doctor availability management | ❌ Read-only |
| Notifications (email/SMS) | ❌ None |
| Account management (patient) | ❌ No profile page |
| Subscription / billing | ❌ Cosmetic only |
| Admin / operations | ❌ None |
| Global error / 404 handling | ⚠️ Partial |

---

## 1. Critical launch blockers

### 1.1 No doctor or clinic self-onboarding
- **Problem:** Doctors are created by running SQL (`claim_doctor_profile`) documented in the README. There is no signup path for a doctor or clinic. The pricing page sells clinic plans that no one can actually buy or start.
- **Why it matters:** A two-sided marketplace cannot operate without a supply side that can join. This is the single largest gap between the current build and a launchable product.
- **Recommended solution:** A clinic/doctor onboarding flow — a distinct signup that creates a `doctor` (and `clinic`) record, captures credentials for verification, and sets `role = 'doctor'`. Gate it behind admin approval (see 1.4).
- **Priority:** Critical · **Complexity:** High

### 1.2 Doctors cannot manage their availability
- **Problem:** `/dashboard/schedule` is read-only. Consulting hours and time-off are seeded; there is no UI to add, edit, or remove them.
- **Why it matters:** The product's core thesis is that the doctor owns the schedule and it is always true. If a doctor can't change their hours, the schedule is only "true" for the seed data. This is a functional contradiction with the value proposition.
- **Recommended solution:** Make the schedule editor writable — add/edit availability rows and time-off blocks. The data model and the `get_available_slots` engine already support it; only the write UI and actions are missing.
- **Priority:** Critical · **Complexity:** Medium

### 1.3 No booking confirmation notification
- **Problem:** Confirming a booking inserts the row and renders a success page. No email or SMS is sent to the patient or the doctor.
- **Why it matters:** "Reliable, confirmed appointments" is the headline promise and the wedge against competitors. A confirmation the patient can't find later (no email, no reminder) reintroduces exactly the no-show problem Curo claims to solve.
- **Recommended solution:** Send a confirmation email on booking (the stack already anticipated Resend) and, ideally, a reminder 24 h before. Add doctor-side notification of new bookings.
- **Priority:** Critical (for the value prop) · **Complexity:** Medium

### 1.4 No admin / operations surface
- **Problem:** The `admin` role exists in the schema but has no interface. There is no way to verify doctors, manage clinics, moderate content, or handle disputes.
- **Why it matters:** Healthcare marketplaces must verify that "doctors" are real, licensed doctors. Without this, the platform carries serious trust and legal risk at launch.
- **Recommended solution:** A minimal admin area to approve/verify doctor applications and manage clinics. Even a basic internal tool is sufficient for launch.
- **Priority:** Critical (trust/legal) · **Complexity:** High

---

## 2. Authentication & account flows

### 2.1 Password reset is only half-built
- **Problem:** `/reset-password` sends the reset email, but there is **no page to actually set a new password**. The link in the email has nowhere to land — the flow dead-ends.
- **Why it matters:** A visible "Forgot password?" that cannot complete is worse than none — users who lock themselves out have no recovery, a common and frustrating launch bug.
- **Recommended solution:** Add a reset-completion page (e.g. `/reset-password/update`) that handles the recovery token and lets the user set a new password, plus the callback handling for the `recovery` type.
- **Priority:** High · **Complexity:** Low–Medium

### 2.2 No patient account / profile page
- **Problem:** There is no `/account` route. A patient can set their name only at signup; there is no way to edit name, phone, email, or password afterwards.
- **Why it matters:** Every commercial product needs basic account self-management. Patients will want to correct a phone number before an appointment; today they cannot.
- **Recommended solution:** An account page to edit profile fields and change password. Data and RLS already support profile updates.
- **Priority:** High · **Complexity:** Low–Medium

### 2.3 Email verification is disabled
- **Problem:** Email confirmation is turned off, so accounts are created with unverified emails. The verification UI exists but is dormant.
- **Why it matters:** Unverified emails mean confirmations and reminders may go to typo'd or fake addresses — again undermining the reliability promise. For healthcare, verified contact details matter.
- **Recommended solution:** Enable verification for launch (the 6-digit flow is already built), accepting the small added signup friction.
- **Priority:** Medium · **Complexity:** Low (already built; a config + template change)

### 2.4 No email-change or account-deletion flow
- **Problem:** Users cannot change their email or delete their account/data from the UI.
- **Why it matters:** Account deletion is a GDPR "right to erasure" expectation your own Privacy Policy promises. Not offering it in-product is an inconsistency between policy and product.
- **Priority:** Medium · **Complexity:** Medium

---

## 3. Doctor-side product logic

### 3.1 Appointments table is read-only
- **Problem:** Doctors can view appointments but cannot mark them completed / no-show / cancelled, or add notes.
- **Why it matters:** Utilisation and no-show metrics (already shown on the dashboard) can never become real if the doctor can't update appointment outcomes. The dashboard shows numbers the doctor can't actually drive.
- **Recommended solution:** Row actions to update appointment status. The `appointment_status` enum already includes `completed` and `no_show`.
- **Priority:** High · **Complexity:** Medium

### 3.2 No doctor-initiated reschedule or patient contact
- **Problem:** When a doctor must move an appointment, there is no mechanism — and no way to reach the patient.
- **Why it matters:** Real clinics reschedule constantly. Without it, the doctor's only option is to do nothing, which breaks the patient's trust in the "confirmed" slot.
- **Priority:** Medium · **Complexity:** Medium

---

## 4. Patient-side product logic

### 4.1 Reschedule is missing (cancel-only)
- **Problem:** My Bookings offers Cancel but not Reschedule (though the screen inventory anticipated it). A patient must cancel and rebook, losing their slot in between.
- **Why it matters:** Reschedule is a top-three action in any booking product; cancel-and-rebook is a lossy substitute.
- **Priority:** Medium · **Complexity:** Medium

### 4.2 No reviews / ratings capture
- **Problem:** Doctor ratings are displayed but seeded; patients cannot leave a review after a visit.
- **Why it matters:** The ratings are a core trust signal, but they are currently fiction. Post-visit reviews are what make them real and defensible.
- **Priority:** Medium · **Complexity:** Medium

---

## 5. States, errors & resilience

### 5.1 Loading states are inconsistent
- **Problem:** Only `/doctors` has a `loading.tsx` skeleton. `/bookings`, `/dashboard`, `/dashboard/appointments`, `/dashboard/schedule` and the booking pages have none.
- **Why it matters:** On a slow connection these pages show a blank flash rather than the skeletons the design system already establishes. Inconsistent perceived performance reads as unfinished.
- **Recommended solution:** Add `loading.tsx` skeletons for the remaining data-backed routes, matching the existing pattern.
- **Priority:** Medium · **Complexity:** Low

### 5.2 No global 404 or error boundary
- **Problem:** There is no app-level `not-found.tsx` or `error.tsx`. A mistyped URL or an unexpected server error falls back to Next.js defaults, which don't match the brand.
- **Why it matters:** A commercial product should never show an unstyled framework error page. It's a visible break in polish and trust.
- **Recommended solution:** Add branded global `not-found.tsx` and `error.tsx`.
- **Priority:** Medium · **Complexity:** Low

---

## 6. Information architecture & navigation

### 6.1 Thin footer / missing standard pages
- **Problem:** The footer links only to Find a doctor, For clinics, Doctor login. There is no About, Contact, Help/Support, or FAQ page (the FAQ lives only on the homepage).
- **Why it matters:** Users and especially clinics evaluating a healthcare product look for company legitimacy — contact routes, support, an about page. Their absence signals "not a real company."
- **Recommended solution:** Add Contact/Support and About pages; expand the footer into a small sitemap.
- **Priority:** Medium · **Complexity:** Low

### 6.2 No cookie consent / accessibility statement
- **Problem:** No cookie banner and no accessibility statement, though the Privacy Policy references data practices.
- **Why it matters:** For an India/EU-facing healthcare product, consent and accessibility disclosures are expected and sometimes required.
- **Priority:** Medium · **Complexity:** Low–Medium

---

## 7. Subscription & monetisation readiness

*(Pre-work assessment — the user has flagged this as the next phase.)*

### 7.1 Pricing CTAs are cosmetic
- **Problem:** "Start 14-day trial" and "Contact sales" all route to `/sign-up`. There is no clinic account type, no plan selection, no checkout, no trial mechanics.
- **Why it matters:** The subscription surface exists visually but has no engine behind it. This is the foundation the next phase must build.
- **Recommended solution:** Introduce a clinic account entity, plan selection, and a billing provider (Stripe) with trial handling.
- **Priority:** High (for monetisation phase) · **Complexity:** High

### 7.2 Plan limits are not enforced
- **Problem:** Plans describe limits (Solo = 1 doctor, Practice = up to 10) but nothing enforces them.
- **Why it matters:** Limits are the mechanism that drives upgrades. Without enforcement there is no upgrade pressure and no monetisation.
- **Recommended solution:** Enforce per-plan doctor/seat limits at the point of adding a doctor, with an upgrade prompt when a limit is hit.
- **Priority:** High (monetisation) · **Complexity:** Medium

### 7.3 No billing settings, invoices, or upgrade nudges
- **Problem:** No clinic billing page, invoice history, or in-app upgrade prompts.
- **Why it matters:** These are the standard touchpoints where SaaS revenue is managed and expanded.
- **Priority:** High (monetisation) · **Complexity:** High

---

## 8. Trust & commercial credibility

### 8.1 No doctor credential verification
- **Problem:** Nothing verifies that a listed doctor is a licensed doctor (compounded by 1.1).
- **Why it matters:** In healthcare this is non-negotiable — for patient safety, platform trust, and legal exposure.
- **Priority:** Critical (with 1.4) · **Complexity:** High (process + tooling)

### 8.2 Ratings are not yet real
- **Problem:** Displayed ratings are seeded (see 4.2).
- **Why it matters:** Presenting fabricated trust signals at commercial launch is a credibility and potentially regulatory risk.
- **Priority:** Medium · **Complexity:** Medium

---

## 9. What is already launch-ready (for balance)

The following are genuinely strong and need no pre-launch work:

- The patient discovery → slot grid → confirm journey, including the double-booking guarantee and graceful slot-taken handling.
- Role-aware navigation and redirects; protected-route guards; RLS data isolation.
- The five-state discipline on the pages that have it; tabular figures; accessibility (WCAG AA verified).
- Legal pages (Terms, Privacy) with an honest demo disclaimer.
- Google OAuth, password/email auth with validation, session refresh.
- An automated Playwright smoke suite covering the whole app.

---

## 10. Recommended sequencing before monetisation

1. **Finish password reset** and add the **patient account page** (2.1, 2.2) — small, closes obvious holes.
2. **Make the doctor side writable** — schedule editor and appointment status (1.2, 3.1) — required for the product to be internally consistent.
3. **Add confirmation email** (1.3) — delivers the core promise.
4. **Build doctor/clinic onboarding + admin verification** (1.1, 1.4, 8.1) — opens the supply side.
5. **Add global error/404 and remaining loading states** (5.1, 5.2) — polish.
6. **Only then** begin subscription/billing (Section 7), which depends on 1.1 existing.

Monetisation work should not begin until items 1–4 exist, because a subscription with no self-serve supply side and no doctor tooling has nothing to actually sell.
