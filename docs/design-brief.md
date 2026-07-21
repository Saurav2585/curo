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

*Based on published user reviews and product documentation, July 2026. Sources at the foot of this page.*

| Product | The gap Curo aims at |
|---|---|
| **Practo** | The confirmation itself is unreliable. Users report appointments that never get confirmed, prerecorded messages redirecting them to the hospital, doctor no-shows, and wrong clinic details on "confirmed" bookings. One reviewer describes the confirmation system as "completely broken". |
| **Zocdoc** | A strong, well-structured flow, but insurance verification sits between the patient and a slot, and reviewers report **calendar mismatches caused by provider-managed schedules** — the platform shows availability it doesn't actually control. |
| **Apollo 24\|7** | Booking itself reviews well; the complaints are about the surrounding app — layout clutter, a profile-setup prompt that blocks entry on open, and doctors missing from nearby-specialty search. Discovery is the weak surface, not the booking. |

**The common root cause is sharper than "availability is hidden".** In all three, *the platform is not the source of truth for the doctor's calendar.* The clinic owns the schedule, the platform holds a stale copy, and the two drift. Everything patients complain about — unconfirmed bookings, no-shows, wrong times, calendar mismatches — follows from that single architectural fact.

## The design bet

Two moves, and the second is the one that matters.

**One: borrow the seat map.** A doctor's day is a grid of time slots with three unmistakable states — available, filling fast, taken. The patient reads the whole day at a glance and commits in one tap. It's the mechanic that made cinema ticketing obvious.

**Two: make the grid the truth, not a picture of it.** Curo computes every slot from the doctor's own availability rules minus their time off minus real bookings, live, on one database. There is no synced copy to drift. A booking is confirmed the instant it's written, because a partial unique index makes a conflicting write impossible.

That is why the incumbents' central failure can't happen here — not because Curo tries harder at confirmation, but because the architecture removes the gap that produces the failure.

---

**Sources**

- [Practo reviews — PissedConsumer](https://practo.pissedconsumer.com/review.html)
- [Practo reviews — Trustpilot](https://www.trustpilot.com/review/practo.com)
- [Zocdoc review: provider coverage, filters and user experience](https://leafsnap.com/zocdoc-assessing-provider-coverage-filters-and-user-experience/)
- [What a high-converting healthcare booking experience looks like — Zocdoc](https://www.zocdoc.com/resources/blog/article/high-converting-healthcare-booking-experience-looks-like)
- [Apollo 247 — Google Play reviews](https://play.google.com/store/apps/details?id=com.apollo.patientapp&hl=en_IN)
- [Apollo 247 — App Store reviews](https://apps.apple.com/in/app/apollo-247-health-medicine/id1496740273)

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
