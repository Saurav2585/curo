import { createClient } from "@/lib/supabase/server";

/**
 * The event catalogue — the platform's communication layer. Every meaningful
 * thing that happens is an event; notifications (and future email / SMS / push)
 * consume events. To add an event: add the value to the `app_event_type` DB enum
 * (migration) and a metadata entry here. Nothing else needs to change.
 *
 * Emission is centralised in `emitEvent()` below, which calls the security-
 * definer `emit_notification` RPC. No page creates notifications directly.
 */

export type AppEventType =
  | "appointment_booked" | "appointment_cancelled" | "appointment_completed" | "appointment_rescheduled"
  | "review_submitted" | "review_reported"
  | "provider_application_submitted" | "doctor_approved" | "doctor_rejected" | "pending_approval"
  | "trial_expiring" | "subscription_activated" | "subscription_renewed" | "subscription_cancelled" | "billing_alert"
  | "promotion_available" | "promotion_expiring"
  | "profile_incomplete" | "visibility_updated" | "leave_created" | "schedule_updated";

export type NotificationChannel = "in_app" | "email" | "sms" | "push";
export type Audience = "patient" | "doctor" | "admin";

/** Icon token → resolved to a lucide component in the notification item. */
export type EventIcon =
  | "calendar-plus" | "calendar-x" | "calendar-check" | "calendar-clock"
  | "star" | "flag" | "file-text" | "check" | "x" | "clock"
  | "credit-card" | "receipt" | "tag" | "user" | "eye" | "plane";

/** Visual tone, mapped to existing status token families in the component. */
export type EventTone = "brand" | "success" | "danger" | "warning" | "muted";

export type EventMeta = {
  label: string;
  icon: EventIcon;
  tone: EventTone;
  audience: Audience[];
};

export const EVENT_CATALOGUE: Record<AppEventType, EventMeta> = {
  appointment_booked:    { label: "Appointment booked",    icon: "calendar-plus",  tone: "brand",   audience: ["patient", "doctor"] },
  appointment_cancelled: { label: "Appointment cancelled", icon: "calendar-x",     tone: "danger",  audience: ["patient", "doctor"] },
  appointment_completed: { label: "Appointment completed", icon: "calendar-check", tone: "success", audience: ["patient", "doctor"] },
  appointment_rescheduled:{label: "Appointment rescheduled",icon:"calendar-clock", tone: "warning", audience: ["patient", "doctor"] },

  review_submitted:      { label: "Review submitted",      icon: "star",           tone: "success", audience: ["doctor", "patient"] },
  review_reported:       { label: "Review reported",       icon: "flag",           tone: "danger",  audience: ["admin"] },

  provider_application_submitted: { label: "Application submitted", icon: "file-text", tone: "brand", audience: ["admin"] },
  doctor_approved:       { label: "Application approved",  icon: "check",          tone: "success", audience: ["doctor"] },
  doctor_rejected:       { label: "Application rejected",  icon: "x",              tone: "danger",  audience: ["doctor"] },
  pending_approval:      { label: "Pending approval",      icon: "clock",          tone: "warning", audience: ["admin"] },

  trial_expiring:        { label: "Trial expiring",        icon: "clock",          tone: "warning", audience: ["doctor"] },
  subscription_activated:{ label: "Subscription activated",icon: "credit-card",    tone: "success", audience: ["doctor", "patient"] },
  subscription_renewed:  { label: "Subscription renewed",  icon: "credit-card",    tone: "success", audience: ["doctor", "patient"] },
  subscription_cancelled:{ label: "Subscription cancelled",icon: "credit-card",    tone: "muted",   audience: ["doctor", "patient"] },
  billing_alert:         { label: "Billing alert",         icon: "receipt",        tone: "danger",  audience: ["admin", "doctor"] },

  promotion_available:   { label: "Promotion available",   icon: "tag",            tone: "brand",   audience: ["patient", "doctor"] },
  promotion_expiring:    { label: "Promotion expiring",    icon: "tag",            tone: "warning", audience: ["admin"] },

  profile_incomplete:    { label: "Profile incomplete",    icon: "user",           tone: "warning", audience: ["doctor"] },
  visibility_updated:    { label: "Visibility updated",    icon: "eye",            tone: "brand",   audience: ["doctor"] },
  leave_created:         { label: "Leave created",         icon: "plane",          tone: "muted",   audience: ["doctor"] },
  schedule_updated:      { label: "Schedule updated",      icon: "calendar-clock", tone: "muted",   audience: ["doctor"] },
};

export const APP_EVENT_TYPES = Object.keys(EVENT_CATALOGUE) as AppEventType[];

export const eventMeta = (type: AppEventType): EventMeta =>
  EVENT_CATALOGUE[type] ?? { label: "Notification", icon: "calendar-check", tone: "muted", audience: [] };

/**
 * Centralised event emission. Logs the event and materialises an in-app
 * notification for the recipient (via the security-definer RPC). Title defaults
 * to the catalogue label. Future channels reuse this same entry point.
 *
 * Reusable and side-effect-only for notifications — it does not send email / SMS
 * / push and is not wired into any existing flow yet.
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
