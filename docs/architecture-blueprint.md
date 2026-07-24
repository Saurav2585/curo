# Curo — Two-Sided Marketplace Architecture Blueprint

*A design-only blueprint for evolving Curo from a patient-first booking app into a true two-sided healthcare marketplace (Patients ⇄ Doctors / Clinics / Hospitals), with Admin oversight — without breaking any existing functionality, and leaving subscription/billing easy to bolt on later.*

**No code. No schema changes. Design only.** Grounded in the current build: single Supabase Auth (`auth.users`), a `profiles` table with a `role` enum (`patient | doctor | admin`), `doctors`/`clinics`/`availability`/`appointments` tables, RLS, and role-aware redirects already in place.

---

## Guiding principles (the non-negotiables)

1. **One authentication system, many roles.** Do **not** create a separate auth store for doctors. Everyone is an `auth.users` row; what differs is their **role** and, for providers, their **application status**. This is simpler, more secure, and non-breaking.
2. **Never let a user assign their own privileged role.** A doctor signup must **not** grant doctor access. It creates a *pending application*; elevation to `doctor` happens only via **admin approval**, server-side. This is the single most important security rule in the whole design.
3. **Additive, not renamed.** Existing patient routes (`/`, `/doctors`, `/bookings`, `/sign-in`) stay exactly as they are. New provider/admin surfaces are **added** alongside. Renaming breaks deep links, SEO, saved bookings, and the Playwright suite.
4. **The billable entity is the clinic, not the doctor.** Model an organisation that owns doctors and, later, the subscription. This makes monetisation a clean add-on rather than a refactor.

---

## 1. Information Architecture

Five audiences, three "product surfaces":

```
                         ┌────────────────────────────────────────┐
   GUEST  ───────────►   │  PUBLIC SURFACE                         │
   (not signed in)       │  Landing · Search · Doctor profile ·    │
                         │  Slot grid · Pricing · Legal · Auth     │
                         └────────────────────────────────────────┘
                                        │ signs in
                 ┌──────────────────────┼───────────────────────────┐
                 ▼                      ▼                           ▼
   ┌───────────────────┐   ┌─────────────────────────┐   ┌───────────────────┐
   │ PATIENT SURFACE   │   │ PROVIDER SURFACE        │   │ ADMIN SURFACE     │
   │ My bookings ·     │   │ Doctor / Clinic portal  │   │ Applications ·    │
   │ Account · Booking │   │ Dashboard · Schedule ·  │   │ Verification ·    │
   │ history           │   │ Appointments · Team ·   │   │ Suspensions ·     │
   │                   │   │ Billing (future)        │   │ Audit log         │
   └───────────────────┘   └─────────────────────────┘   └───────────────────┘
```

- **Public surface** is shared by everyone; it never assumes a role.
- **Patient surface** = today's `/bookings`, plus a new `/account`.
- **Provider surface** = today's `/dashboard` family, plus onboarding and (later) team + billing.
- **Admin surface** = new, internal.

Two provider *sub-types* share the provider surface but differ in scope:
- **Solo doctor** — one doctor, is their own "clinic".
- **Clinic / Hospital** — an **organisation** account that owns *multiple* doctors and is the billing owner.

---

## 2. Authentication Flow

### 2.1 Keep one identity, differentiate by claims

- Continue using **Supabase Auth** with a single `auth.users`.
- A user's **role** lives in two mirrored places, for two different jobs:
  - **`app_metadata.role`** (JWT claim, *server-set only*) — used for fast, trustworthy checks in middleware and RLS without a DB round-trip.
  - **`profiles.role`** (queryable) — used by the app for joins and UI.
- **Critical trust boundary:** never store role in `user_metadata` — that is user-editable and must never be trusted for authorisation. `app_metadata` can only be written by the service role, so it is safe to trust.

### 2.2 Patient authentication (extend, keep compatible)

Everything existing stays. Recommended completions:

| Capability | Current | Recommended target design |
|---|---|---|
| Email + password | ✅ | Keep. |
| Google login | ✅ | Keep. |
| Facebook login | UI-ready, provider off | Enable when a Facebook app + review is available; the button/flow is already designed. |
| Email verification | Built, dormant | **Turn on for launch.** New patients verify via the existing 6-digit flow before their first booking confirmation email can be trusted. |
| Forgot / reset password | Request step only | **Complete the loop:** add a reset-completion screen that consumes the recovery token and sets a new password (the current flow dead-ends). |
| Account verification | — | Treat "email verified" as the account-verified signal for patients. |
| Session handling | Middleware refresh ✅ | Keep. Add explicit "session expired → please sign in again" messaging on protected pages. |

### 2.3 Provider authentication

- **Login** is *unified* with patients (same `/sign-in`), because a login form doesn't need to differ — the **role-aware redirect** (already built) sends each user to their surface. One login = fewer surfaces to secure and maintain.
- **Signup is separate**, because provider onboarding is a multi-step application, not a one-field form. A provider begins at a dedicated entry (`/for-providers` → apply), never the patient signup.
- A provider account is a normal `auth.users` row whose **role stays patient-level until approved**; access to the portal is gated on `role = 'doctor'` **and** an approved application status.

---

## 3. Onboarding Flow (Doctor / Clinic / Hospital)

A staged application. Each stage is resumable — a provider can leave and return without losing progress (status persists).

```
[Apply] → [Account] → [Clinic / Org] → [Professional verification]
   → [Email verification] → [Submitted] → [Pending review]
   → Admin: Approve │ Reject │ Request info
        ├─ Approved  → role elevated → [Provider dashboard]
        ├─ Rejected  → [Rejected + reason]
        └─ Info req. → [Action needed] → back to the relevant step
```

### Screen-by-screen design

**A. Apply / choose account type**
- *Purpose:* let a provider start and declare solo-doctor vs clinic/hospital.
- *User goal:* "begin listing my practice."
- *Primary CTA:* Continue as Solo doctor / as Clinic.
- *Secondary:* "I'm a patient instead" → patient signup.
- *States:* Empty (default) · Loading (submitting) · Error (network) · Success → next step.

**B. Account credentials**
- *Purpose:* create the login (email + password, or Google).
- *Goal:* "make my sign-in."
- *Primary:* Create account · *Secondary:* Sign in (if returning).
- *States:* inline validation errors; success → next.

**C. Clinic / Organisation details**
- *Purpose:* capture clinic name, address, city, contact — or link to an existing clinic (hospital inviting a doctor).
- *Goal:* "describe where I practise."
- *Primary:* Save & continue · *Secondary:* Back.
- *States:* Empty form · Partial (autosaved draft) · Error (missing required) · Success.

**D. Professional verification**
- *Purpose:* collect the evidence an admin needs — medical registration/council, registration number, qualifications, specialty, and document upload (license/ID).
- *Goal:* "prove I'm a licensed doctor."
- *Primary:* Submit for review · *Secondary:* Save draft.
- *States:* Empty · Uploading (progress) · Error (bad file / missing field) · Success.

**E. Email verification**
- *Purpose:* confirm the provider's email (reuses the 6-digit flow).
- *States:* code entry · resend w/ countdown · error (wrong/expired) · success.

**F. Application submitted**
- *Purpose:* reassure and set expectations ("we review within X").
- *Goal:* "know what happens next."
- *Primary:* Go to status page · *Secondary:* Return home.
- *State:* success confirmation with a reference.

**G. Pending review (status page)**
- *Purpose:* the provider's home while under review; shows status, what was submitted, and any admin request.
- *States:* Pending · Info requested (with a clear "action needed" CTA) · Rejected (with reason + reapply) · Approved (CTA into the dashboard).

**H. Approved → Provider dashboard**
- On approval, role is elevated to `doctor` and the existing `/dashboard` opens. No redesign — the dashboard already exists.

---

## 4. Role Matrix

| Concern | **Guest** | **Patient** | **Doctor** | **Clinic / Hospital (org admin)** | **Admin (Curo staff)** |
|---|---|---|---|---|---|
| Login behaviour | n/a | `/sign-in` | `/sign-in` | `/sign-in` | `/sign-in` (or a hardened admin login) |
| Post-login redirect | — | `/bookings` | `/dashboard` | `/dashboard` (org view) | `/admin` |
| If provider **pending** | — | — | `/apply/status` (not the dashboard) | same | — |
| Header | Marketing nav + Sign in | Find a doctor · My bookings · Account · Sign out | Portal top-bar (no patient nav) | Portal + Team/Billing | Admin nav |
| Logo target | `/` | `/` | `/dashboard` | `/dashboard` | `/admin` |
| Primary nav | Public | Patient | Provider portal | Provider + org | Admin |
| Route protection | public only | patient + public | provider (approved) + public | provider + org + public | admin only |
| Session persistence | none | Supabase session | same | same | same, shorter TTL recommended |
| Logout target | — | `/` | `/` | `/` | `/admin/login` or `/` |

Key rule encoded here: a **pending** provider is authenticated but **not yet authorised** for the dashboard — they land on their application status page instead.

---

## 5. Route Strategy (safest, non-breaking)

**Recommendation: keep existing routes; add new ones. Do not introduce `/patient/*` prefixes.**

Why not `/patient/login`, `/doctor/login`, etc.:
- Renaming `/sign-in`, `/bookings`, `/doctors` breaks existing deep links, the confirmation URLs patients may have, SEO on doctor profiles, and the passing Playwright suite.
- Two login pages doubles the auth attack surface and the maintenance cost for zero user benefit — a login form is identical regardless of role; the **redirect** is what differs, and that already works.

**Proposed additive map:**

```
Existing (unchanged)          New (added)
──────────────────────        ─────────────────────────────
/                             /for-providers        (provider marketing)
/doctors, /doctors/[slug]     /apply                (provider onboarding wizard)
/doctors/[slug]/book…         /apply/status         (pending/approved/rejected)
/sign-in  (universal)         /account              (patient profile — fills a gap)
/sign-up  (patient)           /reset-password/update (completes forgot-password)
/bookings, /bookings/[id]     /dashboard/team       (clinic: manage doctors)
/dashboard/*  (provider)      /dashboard/billing    (future subscription)
/pricing, /terms, /privacy    /admin/*              (internal review console)
```

- **Login stays unified** at `/sign-in`; role-aware redirect routes users onward.
- **Signup diverges by intent:** `/sign-up` (patient, unchanged) vs `/apply` (provider).
- **Admin** lives under `/admin/*`, protected by the `admin` role and ideally an extra factor.

---

## 6. Security Strategy

| Threat / concern | Design control |
|---|---|
| **Self-granted privilege** | Role is set only by the server/admin. Provider signup creates an application with status `pending`; `role` is elevated to `doctor` **only** on admin approval. Never trust client-supplied role. |
| **Role trust in JWT** | Store role in `app_metadata` (service-role-writable only), mirror to `profiles`. Middleware trusts the `app_metadata` claim; never `user_metadata`. |
| **Email verification** | Required before a provider application can be submitted and before patient confirmation emails are trusted. |
| **Doctor approval gate** | Portal routes check `role = 'doctor'` **AND** application `approved` **AND** not `suspended`. A pending/suspended provider is redirected to their status page. |
| **Protected routes** | Keep server-side checks in layouts/actions (as today), backed by **RLS** as the real enforcement — UI guards are convenience, RLS is the wall. |
| **Deep links** | Any protected URL hit while unauthenticated → redirect to `/sign-in?next=…`; while under-authorised (pending doctor hitting `/dashboard`) → redirect to status page. Never render then hide. |
| **Browser refresh** | Session refresh in middleware (already present); protected pages are dynamic and re-check on every request. |
| **Unauthorized access** | RLS ensures a doctor cannot read another doctor's calendar and a patient cannot read others' bookings — regardless of the URL. Extend the same pattern to org/admin data. |
| **Admin surface** | Separate role, shorter session TTL, ideally IP/allowlist or 2FA. Log every approval/rejection/suspension to an audit trail. |
| **Document storage** | Verification documents (licenses/IDs) held in a private bucket, readable only by admins and the owning provider, never public. |

---

## 7. Database Changes (high-level only — no SQL)

New or extended **entities**:

- **`organizations` (clinics/hospitals)** — the billable, doctor-owning entity. *Why:* a hospital has many doctors and one subscription; modelling the org now makes billing a clean add-on and supports the "Practice/Hospital" plans that already exist on the pricing page.
- **`doctor_applications`** (or a status column set on `doctors`) — captures the onboarding lifecycle: `draft → submitted → under_review → info_requested → approved → rejected → suspended`. *Why:* the approval workflow and the "pending vs approved" gate depend on an explicit status.
- **`verification_details`** — registration council, registration number, specialty, and links to uploaded documents. *Why:* admins need structured evidence to approve; keeps sensitive proof separate from the public `doctors` profile.
- **`organization_members` / invitations** — links doctors to an org and lets a clinic admin invite doctors. *Why:* supports hospital→many-doctors and seat-based plans.
- **`admin_actions` (audit log)** — who approved/rejected/suspended whom, when, and why. *Why:* healthcare compliance and dispute resolution require an auditable trail.

New **relationships**:
- `organization 1—* doctors` · `organization 1—* organization_members` · `doctor 1—1 verification_details` · `doctor 1—* appointments` (exists) · `admin_actions *—1 target`.

New **auth metadata**:
- `app_metadata.role` (server-set) and, for providers, `app_metadata.org_id` — so org scoping is available as a trusted claim.

**Non-breaking note:** all of the above are *additive*. The existing `profiles`, `doctors`, `appointments`, and the slot engine remain untouched; a solo doctor can be represented as an org-of-one so the model is uniform.

---

## 8. UX Flow (state coverage summary)

Every new screen must ship the five states the design system already mandates:

| Screen | Empty | Loading | Error | Success | Notes |
|---|---|---|---|---|---|
| Apply / choose type | default cards | — | — | → next | |
| Account credentials | blank form | button spinner | inline validation | → next | reuse existing auth styling |
| Clinic details | blank / draft | autosave | required-field errors | saved | resumable draft |
| Professional verification | blank | upload progress | bad file / missing | submitted | private document upload |
| Email verification | code entry | verifying | wrong/expired code | verified | reuse 6-digit flow |
| Submitted | — | — | — | confirmation + ref | |
| Status page | pending | polling | load error | approved CTA | also: info-requested, rejected+reason |
| Account (patient) | prefilled | saving | save failed | saved toast | fills current gap |
| Admin: applications | "no pending" | table skeleton | load error | action done | queue view |

---

## 9. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Role confusion regressions** | A change to redirects breaks the patient flow | The universal-login + role-redirect pattern already exists and is test-covered; extend it, don't replace it. Run the Playwright suite on every change. |
| **Privilege escalation** | Someone self-grants `doctor`/`admin` | Role only ever set server-side on approval; enforced by RLS, not UI. Treat as the top security invariant. |
| **Onboarding abandonment** | Long provider signup kills supply growth | Make every step resumable (persist draft status); show progress; defer document upload as late as possible. |
| **Fake/unlicensed doctors** | Patient safety + legal exposure | Mandatory verification + admin approval before any listing goes live. |
| **Breaking existing routes** | Lost links, failed tests, SEO hit | Additive routing only; no renames. |
| **Billing coupled to the wrong entity** | Painful refactor later | Anchor subscriptions to `organizations` from day one, even for solo doctors (org-of-one). |
| **Admin surface as a soft target** | Whole platform compromise | Separate role, hardened login, audit log, least-privilege RLS. |

---

## 10. Recommended Implementation Order

Sequenced so nothing breaks and each step unlocks the next:

1. **Close the auth gaps first (low risk, high value):** complete forgot-password (reset-completion page), add the patient `/account` page, enable email verification. *These finish existing flows and touch no roles.*
2. **Introduce the role/claim foundation:** mirror role into `app_metadata`; add the `organizations` entity (solo doctor = org-of-one). *No user-visible change; sets the base.*
3. **Provider onboarding (application + status), gated:** build `/apply` and `/apply/status`; role stays patient-level until approval. *Dashboard remains approval-gated.*
4. **Admin review console:** approvals/rejections/info-requests + audit log. *Turns applications into live providers.*
5. **Doctor tooling parity:** make schedule editable and appointments actionable (from the earlier launch-readiness audit). *Makes an approved provider actually operational.*
6. **Clinic team management:** invitations + `organization_members` for hospitals.
7. **Only then: subscription & billing** on the `organizations` entity — plan selection, seat/doctor limits enforced, upgrade prompts, invoices.

Billing is deliberately last because it depends on organisations, providers, and admin approval all existing first. Building it earlier would mean billing an entity that can't yet onboard or operate.

---

### One-paragraph summary

Keep a single Supabase identity and differentiate by a **server-controlled role** plus a **provider application status**; never let a user self-assign privilege. Leave all existing patient routes untouched and **add** provider (`/apply`, `/dashboard/*`) and admin (`/admin/*`) surfaces beside them, with a **unified login** and role-aware redirects. Model the **clinic/organisation** as the doctor-owning, billable entity now, so subscription and billing later become an additive module rather than a rewrite. Gate the provider portal on **approved + not-suspended**, enforce everything with **RLS**, and verify doctor credentials through an **admin workflow** before any listing goes live.
