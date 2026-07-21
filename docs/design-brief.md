# Curo — Design Brief

*One page. Nothing built after this may contradict it.*

---

## The problem

Booking a doctor is still a phone call. The patient calls a clinic, is put on hold, is offered a slot that doesn't work, calls another clinic, and repeats. Meanwhile the clinic loses reception hours to the phone and still runs a 30% no-show rate because nothing confirms or reminds.

Online alternatives exist, but most of them solve discovery — endless doctor listings, reviews, filters — and then hand the patient back to a "request callback" button. The booking itself never actually completes online.

**Curo makes the slot the product.** Discovery is a means to one end: a confirmed, specific, real appointment time.

## The audience

**Primary — the patient.** Urban Indian, 25–45, booking for themselves or a parent, usually on a phone, usually within 48 hours of needing care. They are not browsing. They want the soonest credible appointment with the right kind of doctor, near them, at a fee they can see before committing.

**Secondary — the doctor and clinic front desk.** They need the day's schedule to be true, editable, and free of double-bookings.

## The activation metric

> **A patient completes a booking within 90 seconds of landing.**

Not "signed up". Not "searched". A real appointment on a real doctor's calendar. Every discovery decision is designed backwards from this: filters that narrow to bookable slots rather than to doctors, availability visible on the results card before the profile page, and auth deferred until the slot is already chosen.

## Where the incumbents leave room

*Directional observations from using these products, to be pressure-tested — not verified market research.*

| Product | The gap Curo aims at |
|---|---|
| **Practo** | Discovery-heavy. Listings, reviews and ads dominate; actual bookable availability is buried a page deep, and many listings end in a callback rather than a confirmed time. |
| **Zocdoc** | Strong booking flow, but insurance-first onboarding front-loads a long form before the patient sees a single slot. Time-to-first-slot is the cost. |
| **Apollo 24\|7** | Bundles pharmacy, labs, and consults into one app. Booking competes for attention with commerce; the appointment is one tile among many. |

**The common weakness: none of them shows you availability at the moment of choosing.** You pick a doctor, *then* discover when they're free — and often backtrack. Curo inverts it.

## The design bet

Borrow the mechanic that made cinema ticketing obvious: **a seat map**. A doctor's day is a grid of time slots with three unmistakable states — available, filling fast, taken. The patient reads the whole day in one glance and commits with one tap.

That grid is the centre of the product. Discovery leads into it, confirmation flows out of it, and the doctor-side dashboard is the same data seen from behind the desk.

## Success criteria

| | Target |
|---|---|
| Time from landing to confirmed booking | under 90 seconds |
| Taps from results page to confirmation | 4 or fewer |
| Slot grid readable without the legend | yes — colour plus shape plus label |
| Double-booking possible under concurrent load | no, enforced at the database |
| All five UI states designed on every view | yes, no exceptions |
| WCAG 2.2 AA on contrast, focus, keyboard | yes, verified by automated test |
| Deployed and reachable from a cold browser | yes, by Friday morning |

## Out of scope

Payments, video consultation, prescriptions and records, patient review writing, lab test ordering, insurance handling, notifications beyond a booking confirmation, multi-language.

A demo is judged on how well one flow is executed. This one executes the booking flow.
