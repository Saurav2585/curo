"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPatientMembership, providerCanReceiveBookings } from "@/lib/subscription";
import { can } from "@/lib/entitlements";

export type BookingState =
  | { status: "error"; message: string }
  | { status: "slot_taken"; message: string; alternatives: string[] }
  | null;

/**
 * The insert that backs the product's core promise.
 *
 * Two patients can reach this action for the same slot at the same time. The
 * partial unique index `appointments_no_double_book` lets exactly one win; the
 * loser's insert raises 23505, which we translate into a calm "just taken,
 * here are the nearest times" rather than a crash or a silent double booking.
 */
export async function confirmBooking(
  _prev: BookingState,
  formData: FormData
): Promise<BookingState> {
  const doctorId = String(formData.get("doctor_id") ?? "");
  const doctorSlug = String(formData.get("doctor_slug") ?? "");
  const slotStart = String(formData.get("slot_start") ?? "");
  const slotEnd = String(formData.get("slot_end") ?? "");
  const patientName = String(formData.get("patient_name") ?? "").trim();
  const patientPhone = String(formData.get("patient_phone") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!patientName) return { status: "error", message: "Enter the patient's name." };
  if (!patientPhone || patientPhone.replace(/\D/g, "").length < 10)
    return { status: "error", message: "Enter a valid phone number." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Auth is deferred to exactly here — the slot is already chosen, so we send
    // them to sign in and straight back to this confirm page.
    redirect(
      `/sign-in?next=${encodeURIComponent(
        `/doctors/${doctorSlug}/book/confirm?slot=${slotStart}`
      )}`
    );
  }

  // --- Server-side subscription enforcement (client checks are UX only) ---
  // Existing bookings/history are untouched; only this NEW booking is gated.

  // 1) The provider must be able to receive new bookings (expired trials cannot).
  if (!(await providerCanReceiveBookings(doctorId))) {
    return {
      status: "error",
      message:
        "This provider isn’t accepting new bookings right now. Please choose another doctor.",
    };
  }

  // 2) Free patients are capped at their complimentary appointments (including
  //    any active promotion); Care+ is unlimited. The permission comes from the
  //    entitlement engine, never a hardcoded plan check.
  const membership = await getPatientMembership();
  if (
    membership &&
    !can(membership.plan, "unlimited_appointments") &&
    membership.used >= membership.quota
  ) {
    return {
      status: "error",
      message: `You’ve used all ${membership.quota} complimentary appointments this month. Upgrade to Care+ for unlimited bookings — your existing appointments stay available.`,
    };
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      doctor_id: doctorId,
      patient_id: user.id,
      patient_name: patientName,
      patient_phone: patientPhone,
      starts_at: slotStart,
      ends_at: slotEnd,
      reason: reason || null,
    })
    .select("id, reference")
    .single();

  if (error) {
    // 23505 = unique_violation on the double-book index: the slot went while
    // this patient was filling in the form.
    if (error.code === "23505") {
      const { data: next } = await supabase.rpc("next_available_slots", {
        p_doctor_id: doctorId,
        p_limit: 3,
      });
      return {
        status: "slot_taken",
        message: "That time was just booked by someone else.",
        alternatives: (next ?? []).map(
          (r: { slot_start: string }) => r.slot_start
        ),
      };
    }
    return { status: "error", message: "Couldn't confirm the booking. Please try again." };
  }

  redirect(`/bookings/${data.id}`);
}
