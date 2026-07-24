"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin provider actions. Each calls the admin-only SQL function, which itself
 * re-checks the caller is an admin — so authority is enforced at the database,
 * not just the UI.
 */
async function callAdmin(fn: string, args: Record<string, unknown>) {
  const supabase = await createClient();
  await supabase.rpc(fn, args);
  revalidatePath("/admin/providers");
}

export async function approveApplication(formData: FormData) {
  await callAdmin("approve_provider_application", { p_app_id: String(formData.get("id")) });
}

export async function rejectApplication(formData: FormData) {
  await callAdmin("set_application_status", {
    p_app_id: String(formData.get("id")),
    p_status: "rejected",
    p_notes: String(formData.get("notes") ?? "") || null,
  });
}

export async function requestMoreInfo(formData: FormData) {
  await callAdmin("set_application_status", {
    p_app_id: String(formData.get("id")),
    p_status: "info_requested",
    p_notes: String(formData.get("notes") ?? "") || null,
  });
}

export async function suspendProvider(formData: FormData) {
  await callAdmin("set_application_status", {
    p_app_id: String(formData.get("id")),
    p_status: "suspended",
    p_notes: String(formData.get("notes") ?? "") || null,
  });
}

export async function reactivateProvider(formData: FormData) {
  await callAdmin("set_application_status", {
    p_app_id: String(formData.get("id")),
    p_status: "approved",
    p_notes: null,
  });
}
