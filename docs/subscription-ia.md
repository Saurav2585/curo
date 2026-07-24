# Curo — Subscription Information Architecture

*Design-only. No implementation. Defines where every subscription surface lives, how it connects to the existing product, and how each lifecycle flow behaves. Built to reuse Curo's current design language (tokens, cards, the status-page pattern, the dashboard sidebar) so billing feels like part of the product, not a separate system.*

---

## Guiding principles

1. **Subscriptions live inside existing homes, never a new top-level "SaaS console."** Patients get billing inside their **Account**; providers get it inside **Settings**. No new primary nav destinations that shout "money."
2. **The core product is never held hostage.** Free booking (patient) and the free provider tier stay fully functional. Billing surfaces are calm, secondary, and always exit back to the real work.
3. **Reuse three patterns we already have:** the **pricing cards** (comparison), the **`/apply/status` full-screen state** (trial expiry, cancellation confirmation), and the **dashboard KPI/card** style (plan summary, usage).
4. **Payments:** Razorpay (UPI + cards + netbanking) for India, with GST-compliant invoices. This is an implementation detail noted here only to shape the invoice/receipt IA.

---

## PART A — PATIENT

Patients have no dashboard by design (their home is **My Bookings**). Subscription lives in a light **Account** area, reached from the header account menu — not a demanded destination.

### Navigation placement
- Header (signed-in patient): `Find a doctor · My bookings · Account ▾ · Sign out`.
- **Account ▾** menu → `Profile · Membership · Billing · Offers · Sign out`.
- Contextual entry points (the real drivers) live *in the flow*, not the nav: a post-booking card, an "add family member" moment, a partner-clinic profile.

### Account IA (single area, sectioned)
```
/account
  ├─ Profile            name, phone, email, password
  ├─ Membership         current plan · usage · upgrade
  ├─ Billing            payment method · next renewal · payment history
  └─ Offers             partner discounts available to your plan
```

**Current Plan** (top of Membership)
- A single summary card: plan name (Free / Plus / Plus Family), price, renewal date (if paid), and a primary action ("Upgrade" on Free, "Manage" on paid).
- **Plan Usage** shown inline as quiet meters: family profiles used (e.g. 2 / 4), SMS reminders on/off, and — the retention hook — **"You've saved ₹X this year."**

**Upgrade Flow (patient)**
```
Membership → Upgrade
  → Plan comparison (reuse pricing cards, patient plans only)
  → Confirm plan + billing cycle (monthly / yearly, "2 months free")
  → Razorpay checkout
  → Success state → back to Membership with new plan reflected
```
- Entry points: Membership page, post-booking card ("Add SMS reminders + skip the queue"), adding a 2nd family profile, a partner-clinic profile ("Plus members save 10% here").

**Billing / Payment History**
- Payment method (managed via Razorpay), next renewal date, and a **payment history table**: date · description · amount · status · receipt (download).
- **Offers**: a simple list of partner discounts unlocked by the current plan; on Free, this section previews what Plus unlocks (upgrade nudge in context).

### Patient empty states
- **Free plan:** Membership shows the Free card + a soft "What Plus adds" preview; Billing shows "No payments yet — you're on the free plan."; Offers previews locked benefits.
- **No family profiles yet:** "Add a family member to manage their bookings here."
- **No payment history:** friendly zero-state, not a blank table.

---

## PART B — DOCTOR (Solo / Clinic)

Providers already have a dashboard with a sidebar (`Overview · Appointments · Schedule`). Billing belongs in **Settings**, kept out of the clinical workflow, with only a **quiet trial/plan pill** surfacing in the dashboard chrome.

### Navigation placement
- Add one sidebar item at the **bottom group**, visually separated from clinical items:
```
Overview
Appointments
Schedule
──────────
Settings        ← new (gear icon)
```
- **Settings** hub (tabbed), where billing lives among other account settings:
```
/dashboard/settings
  ├─ Profile           public profile fields
  ├─ Plan & Billing    current plan · upgrade · payment method · invoices
  ├─ Visibility        featured / sponsored add-ons
  └─ Team              (Clinic only) doctors + reception seats
```

### Dashboard placement (contextual, not nagging)
- **Trial status pill** in the dashboard top area: `Trial · 18 days left →` linking to Plan & Billing. Turns amber under 5 days.
- **Overview upgrade card**, tied to a real signal only: e.g. a **blurred analytics preview** — "See your booking trends with Pro" — using the doctor's own data as the hook. One card, dismissible.

### Subscription surfaces
**Trial Status** — shown as: the pill (chrome), a banner on Plan & Billing ("You're on a 30-day Pro trial — 18 days left, no card required"), and pre-expiry reminders (see flow 8).

**Subscription / Plan & Billing** (the hub tab)
- Plan summary card: tier, price, billing cycle, renewal/trial date, primary action.
- Feature list of the current tier + "Compare plans" link (reuses pricing cards, provider plans).
- Payment method (Razorpay) and **Invoices** table: date · plan · period · amount · GST · download.

**Upgrade (doctor)**
```
Plan & Billing → Compare plans → Choose tier + cycle → Razorpay → Success → plan active
```
- Natural upgrade triggers surfaced contextually: adding a 2nd doctor (→ Clinic), viewing locked analytics (→ Pro), low SMS allowance (→ credits).

**Visibility Pack** (add-on, its own Settings tab)
- Purchasable add-ons: Featured doctor, Sponsored placement, homepage promotion — each clearly labelled, with a plain explanation of what it does and honest limits ("clearly marked as Sponsored; capped per specialty").
- Bought and managed here; billed as add-ons alongside the base plan on the same invoice.

**Billing / Invoices** — as above; invoices are GST-compliant and downloadable; failed-payment state handled by dunning (flow 9).

### Doctor empty states
- **Free tier:** Plan & Billing shows Free card + "Start 30-day Pro trial" (no card); Invoices: "No invoices yet."
- **On trial:** banner with days left; Invoices empty until first charge.
- **Visibility tab (no add-ons):** explains each pack with a "Add" action, not a blank page.
- **Team tab (Clinic, one doctor):** "Invite your first doctor" / "Add a reception seat."

---

## PART C — HOSPITAL (Enterprise)

Hospitals are **sales-assisted, not self-serve.** No public checkout for hospital pricing.

### Enterprise Contact Flow
```
Trigger (11th doctor / 2nd branch / "Hospital" chosen at onboarding / "Contact sales" on /for-providers)
  → Enterprise contact form (org name, size, branches, need)
  → Confirmation state ("Our team will reach out within 1 business day")
  → Sales-assisted setup → contract → account provisioned
```
- Entry points: the `/for-providers` page ("Talk to sales"), and a contextual dashboard prompt when a Clinic hits hospital-scale limits ("You've outgrown Clinic — let's talk about Hospital").

### Subscription Management (hospital, under contract)
- A **read-mostly** Plan & Billing area: current contract summary, branches, seat counts, renewal date, and **"Contact your account manager"** rather than self-serve plan changes.
- Team management (doctors, branches, reception seats) is operational and self-serve; *pricing changes* route through the account manager.
- Invoices/exports available for finance teams.

### Hospital empty states
- **Pre-contract:** dashboard shows the enterprise contact CTA, not billing controls.
- **No branches/seats configured:** guided setup prompts.

---

## Cross-cutting flows (all audiences)

### 1. Navigation placement — summary
| Audience | Home | Billing lives in |
|---|---|---|
| Patient | My Bookings | Account → Membership / Billing / Offers |
| Doctor / Clinic | Dashboard | Settings → Plan & Billing (+ trial pill in chrome) |
| Hospital | Dashboard | Settings → Plan & Billing (read-mostly) + account manager |

### 2. Dashboard placement (providers)
Quiet trial/plan pill in chrome + at most one contextual, dismissible upgrade card tied to a real signal. Never a permanent "Upgrade!" banner.

### 3. Settings integration
One **Settings hub** per provider account (tabs: Profile · Plan & Billing · Visibility · Team). Patients get the lighter **Account** area (sections, not a console). Billing is a *tab/section*, never a separate app.

### 4. Billing page structure (shared skeleton)
```
[ Plan summary card ]  tier · price · cycle · renewal/trial date · primary action
[ Payment method ]     Razorpay-managed · add/update · UPI/card
[ Usage / entitlements ] seats, SMS allowance, family profiles (as relevant)
[ History table ]      date · description · period · amount · GST · status · receipt
[ Danger / manage ]    change plan · cancel (calm, secondary placement)
```

### 5. Upgrade flow
Compare (reuse pricing cards) → confirm tier + cycle → Razorpay → **success state** (reuse the confirmation-card pattern) → return to the same page with the new plan reflected. Contextual entry points do the acquisition; the flow itself is 3 calm steps.

### 6. Downgrade flow
Choose lower tier → **transparent consequences screen**: "You'll lose X and keep access until <renewal date>" (downgrade takes effect at period end, never mid-cycle data loss) → confirm → "Downgrade scheduled for <date>" with an easy "keep my current plan" undo until then.

### 7. Cancellation flow
Secondary, always findable, never buried: "Cancel plan" → optional one-tap reason → **"What you keep until <date>"** summary (access continues to period end) → confirm → status state: "Cancelled — active until <date>" with a one-click **Resubscribe**. No immediate lockout, no retention maze.

### 8. Trial expiry flow (providers)
- Reminders at **7 / 3 / 1 days** (in-app pill + email), value-framed ("keep your analytics and SMS reminders").
- On expiry: **graceful downgrade to Free**, never a lockout. Data preserved. Plan & Billing shows "Your trial ended — upgrade to restore Pro features." Listings/bookings continue on the free tier.

### 9. Renewal flow
- Auto-renew with a **pre-renewal notice 7 days out** (plain, no urgency).
- Post-charge **receipt** (email + Invoices table). For patients, an annual **"you saved ₹X this year"** statement.
- **Failed payment → dunning:** grace period (e.g. 7 days) with in-app + email nudges and easy card update; access continues during grace, then graceful downgrade — never an abrupt cut.

### 10. Empty states (catalogue)
| Surface | Empty state |
|---|---|
| Patient Membership (Free) | Free card + "What Plus adds" preview |
| Patient Billing | "No payments yet — you're on the free plan." |
| Patient Offers (Free) | Locked-benefit preview with upgrade nudge |
| Doctor Invoices | "No invoices yet." |
| Doctor Visibility | Explainer cards with "Add" actions |
| Clinic Team | "Invite your first doctor / Add a reception seat" |
| Hospital pre-contract | Enterprise contact CTA instead of billing controls |
| Any failed/never-added payment method | "Add a payment method to upgrade" |

---

## How this stays "native, not bolted on"

- **No new top-level nav for money.** Billing is a section of Account (patient) / a tab of Settings (provider).
- **Reused components everywhere:** pricing cards for comparison, the status-page pattern for trial/cancel/enterprise states, dashboard cards for plan summaries and usage, existing form and table styles for payment method and history.
- **The same tone as the rest of Curo:** calm, honest, five-state discipline (loading/empty/error/success on every billing surface), tabular figures on every amount, teal accent only on the primary action.
- **Upgrades appear where the value is felt**, not where a marketer wants a banner — so subscription prompts read as product guidance, consistent with the whole app.

*This IA is the blueprint for the subscription build phase. It changes no existing route or page; it defines where the new surfaces attach and how the lifecycle behaves.*
