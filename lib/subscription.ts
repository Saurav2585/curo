import { createClient } from "@/lib/supabase/server";
import { FREE_APPOINTMENT_QUOTA, type PatientPlanId } from "@/lib/plans";

/**
 * Patient membership + usage. Usage is DISPLAY ONLY — booking is never blocked
 * by the quota in this phase. "Used this month" counts the patient's bookings
 * created in the current calendar month.
 */
export async function getPatientMembership() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("membership_plan")
    .eq("id", user.id)
    .maybeSingle();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("patient_id", user.id)
    .gte("created_at", monthStart.toISOString());

  const plan = (profile?.membership_plan as PatientPlanId) ?? "free";
  const used = count ?? 0;

  return {
    plan,
    isFree: plan === "free",
    isHighestTier: plan === "plus_family",
    used,
    quota: FREE_APPOINTMENT_QUOTA,
    remaining: Math.max(0, FREE_APPOINTMENT_QUOTA - used),
  };
}

/**
 * Provider plan + trial for the signed-in doctor. `providerType` is read from
 * their application (hospital → enterprise view); seeded demo doctors with no
 * application default to a solo/clinic view.
 */
export async function getProviderSubscription(doctorId: string, userId: string) {
  const supabase = await createClient();

  const [{ data: doctor }, { data: application }] = await Promise.all([
    supabase.from("doctors").select("plan, trial_ends_at").eq("id", doctorId).maybeSingle(),
    supabase.from("provider_applications").select("provider_type").eq("user_id", userId).maybeSingle(),
  ]);

  const providerType = application?.provider_type ?? "solo";
  const trialEndsAt = doctor?.trial_ends_at ? new Date(doctor.trial_ends_at) : null;
  const daysRemaining = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86_400_000))
    : 0;

  return {
    plan: (doctor?.plan as string) ?? "trial",
    providerType, // 'solo' | 'clinic' | 'hospital'
    isEnterprise: providerType === "hospital",
    onTrial: (doctor?.plan ?? "trial") === "trial" && daysRemaining > 0,
    trialEndsAt,
    daysRemaining,
    trialUrgent: daysRemaining > 0 && daysRemaining < 7,
  };
}
