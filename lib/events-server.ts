import { createClient } from "@/lib/supabase/server";
import { eventMeta, type AppEventType, type NotificationChannel } from "@/lib/events";

/**
 * Server-only event emission. Kept separate from the pure catalogue in
 * lib/events.ts so client components can import event metadata without pulling
 * server code into the browser bundle.
 *
 * Logs the event and materialises an in-app notification for the recipient (via
 * the security-definer `emit_notification` RPC). Title defaults to the catalogue
 * label. Future channels reuse this same entry point. It does not send email /
 * SMS / push and is not wired into any existing flow yet.
 */
export async function emitEvent(input: {
  recipientId: string;
  type: AppEventType;
  title?: string;
  message?: string;
  actionUrl?: string;
  channel?: NotificationChannel;
  actorId?: string;
  subjectType?: string;
  subjectId?: string;
  payload?: Record<string, unknown>;
}): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("emit_notification", {
    p_recipient: input.recipientId,
    p_event: input.type,
    p_title: input.title ?? eventMeta(input.type).label,
    p_message: input.message ?? null,
    p_action_url: input.actionUrl ?? null,
    p_channel: input.channel ?? "in_app",
    p_actor: input.actorId ?? null,
    p_subject_type: input.subjectType ?? null,
    p_subject_id: input.subjectId ?? null,
    p_payload: input.payload ?? {},
  });
  if (error) return null;
  return data as string;
}
