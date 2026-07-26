import { createClient } from "@/lib/supabase/server";
import {
  FREE_APPOINTMENT_QUOTA,
  isHighestPlan,
  normalizePatientPlan,
  normalizeProviderPlan,
  type PatientPlanId,
  type ProviderPlanId,
} from "@/lib/entitlements";
import { deriveLifecycle, type SubscriptionDates, type Lifecycle } from "@/lib/lifecycle";
import { getActivePromotion } from "@/lib/promotions";

type SubRow = {
  plan: string;
  billing_cycle: string | null;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  grace_period_end: string | null;
  cancelled_at: string | null;
  cancel_at_period_end: boolean;
};

const d = (v: string | null | undefined) => (v ? new Date(v) : null);

function datesFromRow(row: SubRow): SubscriptionDates {
  return {
    trialStart: d(row.trial_start),
    trialEnd: d(row.trial_end),
    periodStart: d(row.current_period_start),
    periodEnd: d(row.current_period_end),
    graceEnd: d(row.grace_period_end),
    cancelledAt: d(row.cancelled_at),
    cancelAtPeriodEnd: row.cancel_at_period_end,
    billingCycle: (row.billing_cycle as "monthly" | "yearly" | null) ?? null,
  };
}

/**
 * Patient membership + usage + lifecycle. Usage is DISPLAY ONLY. When a real
 * subscription row exists we derive the lifecycle from it; otherwise a Free
 * patient is the baseline "active/complimentary" state.
 */
export async function getPatientMembership() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("membership_plan").eq("id", user.id).maybeSingle(),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("patient_id", user.id)
    .gte("created_at", monthStart.toISOString());

  const plan: PatientPlanId = normalizePatientPlan(profile?.membership_plan);
  const used = count ?? 0;
  const lifecycle: Lifecycle = sub ? deriveLifecycle(datesFromRow(sub as SubRow)) : deriveLifecycle({});

  // An expired paid membership falls back to Free (display only).
  const effectivePlan: PatientPlanId = lifecycle.state === "expired" ? "free" : plan;

  // The complimentary quota respects an active "extra_appointments" promotion,
  // resolved through the promotion engine — no duplicated promo logic. The
  // single quota computed here is what booking enforcement reads too.
  let quota = FREE_APPOINTMENT_QUOTA;
  if (effectivePlan === "free") {
    const promo = await getActivePromotion({
      placement: "membership",
      audience: "patient",
      role: "patient",
      plan: effectivePlan,
    });
    if (promo && promo.coupon_type === "extra_appointments") {
      quota += Math.max(0, Math.floor(promo.value));
    }
  }

  return {
    plan: effectivePlan,
    isFree: effectivePlan === "free",
    isHighestTier: isHighestPlan(effectivePlan),
    showUpgrade: !isHighestPlan(effectivePlan),
    used,
    quota,
    remaining: Math.max(0, quota - used),
    overLimit: effectivePlan === "free" && used >= quota,
    lifecycle,
  };
}

/**
 * Provider plan + lifecycle. Reads a subscription row if present; otherwise
 * synthesises trial dates from the doctor's `trial_ends_at` so existing demo
 * doctors show an active trial with zero new data.
 */
export async function getProviderSubscription(doctorId: string, userId: string) {
  const supabase = await createClient();

  const [{ data: doctor }, { data: application }, { data: sub }] = await Promise.all([
    supabase.from("doctors").select("plan, trial_ends_at").eq("id", doctorId).maybeSingle(),
    supabase.from("provider_applications").select("provider_type").eq("user_id", userId).maybeSingle(),
    supabase.from("subscriptions").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const providerType = application?.provider_type ?? "solo";
  const rawPlan = doctor?.plan ?? "trial";
  const plan: ProviderPlanId = providerType === "hospital" ? "enterprise" : normalizeProviderPlan(rawPlan);

  // Dates: a real subscription row wins; else synthesise from the trial column.
  const dates: SubscriptionDates = sub
    ? datesFromRow(sub as SubRow)
    : { trialEnd: doctor?.trial_ends_at ? new Date(doctor.trial_ends_at) : null };

  const lifecycle: Lifecycle = deriveLifecycle(dates);

  return {
    plan,
    providerType,
    isEnterprise: plan === "enterprise",
    lifecycle,
    state: lifecycle.state,
    onTrial: lifecycle.state === "trial",
    trialExpired: lifecycle.state === "expired" && rawPlan === "trial",
    daysRemaining: lifecycle.daysRemaining,
    trialUrgent: lifecycle.state === "trial" && lifecycle.urgent,
    trialEndsAt: dates.trialEnd ?? null,
    renewalDate: lifecycle.renewalDate,
    isHighestTier: isHighestPlan(plan),
    // Enterprise + Clinic Pro (top self-serve) never see upgrade prompts.
    showUpgrade: !isHighestPlan(plan) && plan !== "clinic",
  };
}

/**
 * Whether a provider may receive NEW bookings / publish NEW availability.
 * Reuses the lifecycle engine via getProviderSubscription: ONLY an expired trial
 * blocks new actions. Active trials and every paid plan (Professional, Clinic
 * Pro, Enterprise) can operate fully. Historical data is never affected — this
 * gates new actions only. Seeded/unlinked demo doctors are not enforced.
 */
export async function providerCanReceiveBookings(doctorId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("doctors")
    .select("profile_id")
    .eq("id", doctorId)
    .maybeSingle();
  if (!doc?.profile_id) return true;
  const sub = await getProviderSubscription(doctorId, doc.profile_id);
  return !sub.trialExpired;
}
