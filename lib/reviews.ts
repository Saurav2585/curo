import { createClient } from "@/lib/supabase/server";

/**
 * Review & reputation engine. Centralises every rating calculation so no page
 * re-derives an average. Reputation is a separate concept from profile
 * completeness and does NOT overwrite the seeded doctors.rating.
 */

export const REVIEW_DIMENSIONS = [
  { key: "bedside_manner", label: "Bedside manner" },
  { key: "communication", label: "Communication" },
  { key: "wait_time", label: "Wait time" },
  { key: "clinic_experience", label: "Clinic experience" },
] as const;

export type ReviewDimension = (typeof REVIEW_DIMENSIONS)[number]["key"];

export type Review = {
  id: string;
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  overall: number;
  bedside_manner: number | null;
  communication: number | null;
  wait_time: number | null;
  clinic_experience: number | null;
  recommend: boolean;
  title: string | null;
  comment: string | null;
  anonymous: boolean;
  verified_visit: boolean;
  status: string;
  created_at: string;
  edited_at: string | null;
  // joined patient display name (only when not anonymous)
  reviewer_name?: string | null;
};

export type Reputation = {
  count: number;
  average: number;                    // overall, 0–5
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  dimensions: { key: ReviewDimension; label: string; average: number }[];
  recommendPercent: number;
  reputationScore: number;            // 0–100, reusable by ranking
};

const avg = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * The single reputation calculation. Score blends average quality with review
 * volume so a 5.0 from one review doesn't outrank a 4.8 from many.
 */
export function computeReputation(reviews: Review[]): Reputation {
  const count = reviews.length;
  const overallAvg = avg(reviews.map((r) => r.overall));

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
  for (const r of reviews) distribution[Math.round(r.overall) as 1 | 2 | 3 | 4 | 5]++;

  const dimensions = REVIEW_DIMENSIONS.map((d) => ({
    key: d.key,
    label: d.label,
    average: round1(avg(reviews.map((r) => r[d.key]).filter((v): v is number => v != null))),
  }));

  const recommendPercent = count ? Math.round((reviews.filter((r) => r.recommend).length / count) * 100) : 0;

  // 0–100: 80% from quality, 20% from volume (saturates at 50 reviews).
  const reputationScore = Math.round((overallAvg / 5) * 80 + Math.min(count / 50, 1) * 20);

  return {
    count,
    average: round1(overallAvg),
    distribution,
    dimensions,
    recommendPercent,
    reputationScore,
  };
}

// ---------------------------------------------------------------- fetchers
export async function listPublishedReviews(doctorId: string): Promise<Review[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("doctor_id", doctorId)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  // reviewer_name is snapshotted on the row (null when anonymous).
  return (data ?? []) as Review[];
}

export async function getReputation(doctorId: string): Promise<Reputation> {
  return computeReputation(await listPublishedReviews(doctorId));
}

/** Completed appointments the patient hasn't reviewed yet — the review-eligible set. */
export async function getReviewableAppointments(patientId: string) {
  const supabase = await createClient();
  const { data: reviewed } = await supabase.from("reviews").select("appointment_id").eq("patient_id", patientId);
  const reviewedIds = new Set((reviewed ?? []).map((r) => r.appointment_id));

  const { data: appts } = await supabase
    .from("appointments")
    .select("id, doctor_id, starts_at, doctors(full_name, slug)")
    .eq("patient_id", patientId)
    .eq("status", "completed")
    .order("starts_at", { ascending: false });

  return (appts ?? []).filter((a) => !reviewedIds.has(a.id));
}

/** Validate a single appointment is review-eligible for this patient. */
export async function getReviewableAppointment(appointmentId: string, patientId: string) {
  const supabase = await createClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select("id, doctor_id, status, patient_id, doctors(full_name, slug)")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appt || appt.patient_id !== patientId || appt.status !== "completed") return null;

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  return { appointment: appt, alreadyReviewed: !!existing };
}
