"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyDoctor } from "@/lib/doctor";
import { getLifecycleEvents } from "@/lib/workflow-server";
import { currentState, canTransition, ALL_WORKFLOW_STATES, type WorkflowState } from "@/lib/workflow";

/**
 * Record a lifecycle transition for one appointment. Legality is validated by
 * the SINGLE engine (canTransition) before appending; the DB append function
 * additionally authorises the caller. This writes ONLY to the lifecycle history
 * table — appointments.status and booking behaviour are never touched, and
 * nothing auto-transitions.
 */
export async function transitionAppointment(formData: FormData) {
  const doctor = await getMyDoctor();
  if (!doctor) redirect("/dashboard");

  const id = String(formData.get("appointment_id") ?? "");
  const to = String(formData.get("to") ?? "") as WorkflowState;
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!id || !ALL_WORKFLOW_STATES.includes(to)) redirect(`/dashboard/appointments/${id}`);

  const supabase = await createClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select("id, status, doctor_id")
    .eq("id", id)
    .eq("doctor_id", doctor.id) // only the owning doctor
    .maybeSingle();
  if (!appt) redirect("/dashboard/appointments");

  const events = await getLifecycleEvents(id);
  const from = currentState({ baseStatus: appt.status, events });

  // The one legality check. Illegal transitions never reach the database.
  if (!canTransition(from, to)) {
    redirect(`/dashboard/appointments/${id}?error=illegal`);
  }

  const { error } = await supabase.rpc("append_lifecycle_event", {
    p_appointment: id,
    p_from: from,
    p_to: to,
    p_note: note,
  });
  if (error) redirect(`/dashboard/appointments/${id}?error=save`);

  revalidatePath(`/dashboard/appointments/${id}`);
  redirect(`/dashboard/appointments/${id}?ok=1`);
}
