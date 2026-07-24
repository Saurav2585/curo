/**
 * Subscription lifecycle — the single source of date and state maths. Pure and
 * dependency-free: give it the subscription dates, it returns the current
 * lifecycle state. Every surface derives its display from this, so no page ever
 * recomputes "days remaining" or "is it expiring" on its own.
 *
 * Future Razorpay integration writes dates into the subscriptions table; this
 * function turns those dates into the six lifecycle states with no other change.
 */

export type LifecycleState =
  | "trial"
  | "active"
  | "expiring_soon"
  | "grace_period"
  | "expired"
  | "cancelled";

export type BillingCycle = "monthly" | "yearly";

/** Canonical renewal metadata — the shape billing will populate. */
export type SubscriptionDates = {
  trialStart?: Date | null;
  trialEnd?: Date | null;
  periodStart?: Date | null;   // membership/subscription start
  periodEnd?: Date | null;     // membership/subscription end == renewal date
  graceEnd?: Date | null;      // grace period end (after a failed payment)
  cancelledAt?: Date | null;   // when cancellation was requested
  cancelAtPeriodEnd?: boolean; // cancel scheduled for period end
  billingCycle?: BillingCycle | null;
};

export type Lifecycle = {
  state: LifecycleState;
  /** The date the current state hinges on (trial end / period end / grace end). */
  governingDate: Date | null;
  /** Whole days from now to the governing date (>= 0). */
  daysRemaining: number;
  /** The next renewal date, when one applies. */
  renewalDate: Date | null;
  /** True when within the warning window (trial ending / expiring soon / grace). */
  urgent: boolean;
};

/** How many days before period end counts as "expiring soon". */
export const EXPIRING_SOON_DAYS = 7;

const daysUntil = (to: Date, now: Date) =>
  Math.max(0, Math.ceil((to.getTime() - now.getTime()) / 86_400_000));

/**
 * Derive the lifecycle state from dates. Priority order matters:
 * cancelled → grace → trial → active/expiring → expired → baseline.
 */
export function deriveLifecycle(d: SubscriptionDates, now: Date = new Date()): Lifecycle {
  // Cancelled but still within the paid period → access continues to period end.
  if (d.cancelledAt && d.periodEnd && now < d.periodEnd) {
    return { state: "cancelled", governingDate: d.periodEnd, daysRemaining: daysUntil(d.periodEnd, now), renewalDate: null, urgent: false };
  }

  // Payment failed, temporary grace window.
  if (d.graceEnd && now < d.graceEnd) {
    return { state: "grace_period", governingDate: d.graceEnd, daysRemaining: daysUntil(d.graceEnd, now), renewalDate: d.periodEnd ?? null, urgent: true };
  }

  // Active trial.
  if (d.trialEnd && now < d.trialEnd) {
    const dr = daysUntil(d.trialEnd, now);
    return { state: "trial", governingDate: d.trialEnd, daysRemaining: dr, renewalDate: null, urgent: dr < EXPIRING_SOON_DAYS };
  }

  // Active paid period — flip to "expiring soon" inside the warning window.
  if (d.periodEnd && now < d.periodEnd) {
    const dr = daysUntil(d.periodEnd, now);
    const soon = dr <= EXPIRING_SOON_DAYS;
    return { state: soon ? "expiring_soon" : "active", governingDate: d.periodEnd, daysRemaining: dr, renewalDate: d.periodEnd, urgent: soon };
  }

  // A trial or period that has passed with no active replacement → expired.
  if (d.trialEnd || d.periodEnd) {
    return { state: "expired", governingDate: null, daysRemaining: 0, renewalDate: null, urgent: false };
  }

  // No dates at all → baseline (e.g. a Free patient). Treated as active.
  return { state: "active", governingDate: null, daysRemaining: 0, renewalDate: null, urgent: false };
}
