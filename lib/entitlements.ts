/**
 * Subscription Rules Engine — the single source of truth for "who can access
 * what." No enforcement, no payments: this defines entitlements so every
 * feature can ask `can(plan, feature)` instead of hardcoding plan checks.
 *
 * When billing arrives, only the plan a user *holds* changes — this map does
 * not. New features add one line here, not conditionals across pages.
 */

// ---------------------------------------------------------------- plan ids
export type PatientPlanId = "free" | "care_plus";
export type ProviderPlanId = "trial" | "free" | "pro" | "clinic" | "enterprise";
export type PlanId = PatientPlanId | ProviderPlanId;

export type Audience = "patient" | "provider";

// ---------------------------------------------------------------- features
export type Feature =
  // patient
  | "unlimited_appointments"
  | "faster_booking"
  | "priority_support"
  | "lab_discount"
  | "sms_reminders"
  | "family_profiles"
  // provider
  | "analytics"
  | "reception_seats"
  | "multiple_doctors"
  | "multi_branch"
  | "dedicated_manager"
  | "enhanced_profile";

// ---------------------------------------------------------------- plan states
// Re-exported lifecycle states (single definition lives in lib/lifecycle.ts).
export type { LifecycleState as PlanState } from "@/lib/lifecycle";

// ---------------------------------------------------------------- metadata
type PlanMeta = {
  id: PlanId;
  name: string;      // display name / badge label
  audience: Audience;
  tier: number;      // ordering within an audience (higher = better)
  isHighest: boolean;
};

export const PLAN_META: Record<PlanId, PlanMeta> = {
  // patient
  free:       { id: "free",       name: "Free",       audience: "patient",  tier: 0, isHighest: false },
  care_plus:  { id: "care_plus",  name: "Care+",      audience: "patient",  tier: 1, isHighest: true },
  // provider
  trial:      { id: "trial",      name: "Trial",      audience: "provider", tier: 0, isHighest: false },
  // a provider "free" (post-trial, no upgrade) sits at the same floor as trial
  // for ordering but is a distinct badge.
  pro:        { id: "pro",        name: "Professional", audience: "provider", tier: 1, isHighest: false },
  clinic:     { id: "clinic",     name: "Clinic Pro",   audience: "provider", tier: 2, isHighest: false },
  enterprise: { id: "enterprise", name: "Enterprise",   audience: "provider", tier: 3, isHighest: true },
};
// provider "free" isn't in PLAN_META keys above to avoid a 6th badge the spec
// doesn't ask for; treat it as trial-floor via normalizeProviderPlan().

// ---------------------------------------------------------------- entitlements
const ENTITLEMENTS: Record<PlanId, Feature[]> = {
  free: [],
  care_plus: [
    "unlimited_appointments",
    "faster_booking",
    "priority_support",
    "lab_discount",
    "sms_reminders",
    "family_profiles",
  ],
  // A trial grants the full Professional experience.
  trial: ["analytics", "sms_reminders", "reception_seats", "enhanced_profile"],
  pro: ["analytics", "sms_reminders", "reception_seats", "enhanced_profile"],
  clinic: [
    "analytics",
    "sms_reminders",
    "reception_seats",
    "enhanced_profile",
    "multiple_doctors",
    "multi_branch",
  ],
  enterprise: [
    "analytics",
    "sms_reminders",
    "reception_seats",
    "enhanced_profile",
    "multiple_doctors",
    "multi_branch",
    "dedicated_manager",
  ],
};

// ---------------------------------------------------------------- public API
/** The one question every feature should ask. */
export function can(plan: PlanId, feature: Feature): boolean {
  return ENTITLEMENTS[plan]?.includes(feature) ?? false;
}

/** Is this the top plan for its audience? (No upgrade prompts above this.) */
export function isHighestPlan(plan: PlanId): boolean {
  return PLAN_META[plan]?.isHighest ?? false;
}

export function planName(plan: PlanId): string {
  return PLAN_META[plan]?.name ?? "Free";
}

/** Normalise whatever the DB holds into a canonical two-tier patient plan. */
export function normalizePatientPlan(dbValue: string | null | undefined): PatientPlanId {
  return dbValue && dbValue !== "free" ? "care_plus" : "free";
}

/** Normalise the provider plan; a post-trial free provider reads as "trial"
 *  floor for ordering but we keep the raw id for badge/state decisions. */
export function normalizeProviderPlan(dbValue: string | null | undefined): ProviderPlanId {
  const v = (dbValue ?? "trial") as ProviderPlanId;
  return (["trial", "free", "pro", "clinic", "enterprise"] as string[]).includes(v) ? v : "trial";
}

/** Free patient monthly complimentary appointments (display-only quota). */
export const FREE_APPOINTMENT_QUOTA = 3;
