"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Notification state changes. RLS restricts every update to the signed-in
 * recipient, so these are safe without extra ownership checks. They revalidate
 * the whole layout tree so the bell (rendered in layouts) refreshes everywhere.
 */

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function markNotificationRead(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { supabase, user } = await currentUser();
  if (!user || !id) return;
  await supabase
    .from("notifications")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_id", user.id)
    .eq("status", "unread");
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  const { supabase, user } = await currentUser();
  if (!user) return;
  await supabase
    .from("notifications")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .eq("status", "unread");
  revalidatePath("/", "layout");
}

export async function archiveNotification(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { supabase, user } = await currentUser();
  if (!user || !id) return;
  await supabase
    .from("notifications")
    .update({ status: "archived" })
    .eq("id", id)
    .eq("recipient_id", user.id);
  revalidatePath("/", "layout");
}
