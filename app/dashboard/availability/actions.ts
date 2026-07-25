"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyDoctor } from "@/lib/doctor";
import { SCHEDULE_EVENT_KINDS, type ScheduleEventKind } from "@/lib/schedule";

// India has no DST, so the clinic zone is a fixed +05:30 offset. Building the
// timestamp explicitly keeps provider input in clinic-local time.
const CLINIC_OFFSET = "+05:30";
const toClinicISO = (date: string, time: string) => `${date}T${time}:00${CLINIC_OFFSET}`;

/**
 * Create a schedule event (leave, holiday, closure, block, or override) for the
 * signed-in provider. Writes ONLY to schedule_events — slot generation and
 * booking are untouched. RLS guarantees ownership.
 */
export async function addScheduleEvent(formData: FormData) {
  const doctor = await getMyDoctor();
  if (!doctor) redirect("/dashboard");

  const kind = String(formData.get("kind") ?? "") as ScheduleEventKind;
  if (!SCHEDULE_EVENT_KINDS.includes(kind)) {
    redirect("/dashboard/availability?error=kind");
  }

  const allDay = formData.get("all_day") === "on";
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "") || startDate;
  if (!startDate) redirect("/dashboard/availability?error=date");

  const startTime = allDay ? "00:00" : String(formData.get("start_time") ?? "00:00");
  const endTime = allDay ? "23:59" : String(formData.get("end_time") ?? "23:59");

  const startsAt = toClinicISO(startDate, startTime);
  const endsAt = toClinicISO(endDate, endTime);
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    redirect("/dashboard/availability?error=range");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("schedule_events").insert({
    doctor_id: doctor.id,
    kind,
    title: String(formData.get("title") ?? "").trim() || null,
    starts_at: startsAt,
    ends_at: endsAt,
    all_day: allDay,
    override_adds_hours: kind === "override" ? formData.get("override_adds_hours") === "add" : null,
    note: String(formData.get("note") ?? "").trim() || null,
  });

  if (error) redirect("/dashboard/availability?error=save");

  revalidatePath("/dashboard/availability");
  redirect("/dashboard/availability?ok=added");
}

export async function deleteScheduleEvent(formData: FormData) {
  const doctor = await getMyDoctor();
  if (!doctor) redirect("/dashboard");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/dashboard/availability");

  const supabase = await createClient();
  // RLS restricts deletes to the owner; scoping by doctor_id is belt-and-braces.
  await supabase.from("schedule_events").delete().eq("id", id).eq("doctor_id", doctor.id);

  revalidatePath("/dashboard/availability");
  redirect("/dashboard/availability?ok=removed");
}
