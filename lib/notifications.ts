import { createClient } from "@/lib/supabase/server";
import type { AppEventType, NotificationChannel } from "@/lib/events";

/**
 * In-app notification reads. Writes (mark read / archive) live in
 * app/notifications/actions.ts. All access is scoped to the signed-in recipient
 * by RLS; these helpers are the single source of notification data for the bell.
 */

export type NotificationStatus = "unread" | "read" | "archived";

export type AppNotification = {
  id: string;
  recipient_id: string;
  event_type: AppEventType;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  message: string | null;
  action_url: string | null;
  created_at: string;
  read_at: string | null;
};

/** The recipient's active (non-archived) notifications, newest first. */
export async function listNotifications(userId: string, limit = 20): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as AppNotification[];
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("status", "unread");
  return count ?? 0;
}
