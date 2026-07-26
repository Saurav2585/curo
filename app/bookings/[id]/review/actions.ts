"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Submit a review. Eligibility (own + completed + one-per-appointment) is
 * enforced by RLS on the reviews table, so the insert simply fails for anything
 * else. We still resolve the doctor from the appointment server-side rather than
 * trusting client input.
 */
export async function submitReview(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/account/bookings");

  const appointmentId = String(formData.get("appointment_id") ?? "");

  const { data: appt } = await supabase
    .from("appointments")
    .select("id, doctor_id, status, patient_id")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appt || appt.patient_id !== user.id || appt.status !== "completed") {
    redirect("/account/bookings?review=ineligible");
  }

  const num = (name: string) => {
    const v = Number(formData.get(name));
    return v >= 1 && v <= 5 ? v : null;
  };

  const overall = num("overall");
  if (!overall) redirect(`/bookings/${appointmentId}/review?error=overall`);

  const anonymous = formData.get("anonymous") === "on";

  // Snapshot the reviewer's name for public display (null when anonymous), so
  // published reviews never need to join the private profiles table.
  let reviewerName: string | null = null;
  if (!anonymous) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    reviewerName = profile?.full_name?.trim() || null;
  }

  const { error } = await supabase.from("reviews").insert({
    appointment_id: appointmentId,
    doctor_id: appt!.doctor_id,
    patient_id: user.id,
    overall,
    bedside_manner: num("bedside_manner"),
    communication: num("communication"),
    wait_time: num("wait_time"),
    clinic_experience: num("clinic_experience"),
    recommend: formData.get("recommend") === "yes",
    title: (String(formData.get("title") ?? "").trim() || null),
    comment: (String(formData.get("comment") ?? "").trim() || null),
    anonymous,
    reviewer_name: reviewerName,
  });

  if (error) redirect(`/bookings/${appointmentId}/review?error=save`);

  revalidatePath("/account/bookings");
  redirect("/account/bookings?review=thanks");
}
