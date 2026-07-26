import { createClient } from "@/lib/supabase/server";

/**
 * Audit log — the platform's permanent, immutable operational history. This is
 * SEPARATE from notifications: notifications are transient and per-recipient;
 * audit entries are durable facts about what happened. Recording is centralised
 * in `recordAudit()` (the record_audit RPC); nothing writes the table directly.
 *
 * To add an event: add the value to the `audit_event_type` DB enum (migration)
 * and a metadata entry here. No other change is needed.
 */

export type AuditEventType =
  | "user_login" | "user_logout" | "profile_updated" | "password_changed"
  | "appointment_created" | "appointment_cancelled" | "appointment_completed"
  | "provider_application_submitted" | "provider_approved" | "provider_rejected" | "provider_suspended"
  | "subscription_updated" | "promotion_updated" | "visibility_changed"
  | "review_submitted" | "review_hidden" | "schedule_updated";

/** Icon token → resolved to a lucide component in the timeline component. */
export type AuditIcon =
  | "log-in" | "log-out" | "user-pen" | "key" | "calendar-plus" | "calendar-x"
  | "calendar-check" | "file-text" | "check" | "x" | "ban" | "credit-card"
  | "tag" | "eye" | "star" | "eye-off" | "clock";

export type AuditTone = "brand" | "success" | "danger" | "warning" | "muted";

/** Category groups the event for the activity timelines. */
export type AuditCategory = "account" | "practice" | "platform";

export type AuditMeta = { label: string; icon: AuditIcon; tone: AuditTone; category: AuditCategory };

export const AUDIT_CATALOGUE: Record<AuditEventType, AuditMeta> = {
  user_login:        { label: "Signed in",              icon: "log-in",        tone: "muted",   category: "account" },
  user_logout:       { label: "Signed out",             icon: "log-out",       tone: "muted",   category: "account" },
  profile_updated:   { label: "Profile updated",        icon: "user-pen",      tone: "brand",   category: "account" },
  password_changed:  { label: "Password changed",       icon: "key",           tone: "warning", category: "account" },

  appointment_created:   { label: "Appointment created",   icon: "calendar-plus",  tone: "brand",   category: "account" },
  appointment_cancelled: { label: "Appointment cancelled", icon: "calendar-x",     tone: "danger",  category: "account" },
  appointment_completed: { label: "Appointment completed", icon: "calendar-check", tone: "success", category: "practice" },

  provider_application_submitted: { label: "Application submitted", icon: "file-text", tone: "brand",   category: "platform" },
  provider_approved:  { label: "Provider approved",  icon: "check", tone: "success", category: "platform" },
  provider_rejected:  { label: "Provider rejected",  icon: "x",     tone: "danger",  category: "platform" },
  provider_suspended: { label: "Provider suspended", icon: "ban",   tone: "danger",  category: "platform" },

  subscription_updated: { label: "Subscription updated", icon: "credit-card", tone: "brand",   category: "practice" },
  promotion_updated:    { label: "Promotion updated",    icon: "tag",         tone: "brand",   category: "platform" },
  visibility_changed:   { label: "Visibility changed",   icon: "eye",         tone: "brand",   category: "practice" },

  review_submitted: { label: "Review submitted", icon: "star",    tone: "success", category: "practice" },
  review_hidden:    { label: "Review hidden",    icon: "eye-off", tone: "muted",   category: "platform" },
  schedule_updated: { label: "Schedule updated", icon: "clock",   tone: "muted",   category: "practice" },
};

export const AUDIT_EVENT_TYPES = Object.keys(AUDIT_CATALOGUE) as AuditEventType[];

export const auditMeta = (t: AuditEventType): AuditMeta =>
  AUDIT_CATALOGUE[t] ?? { label: "Activity", icon: "clock", tone: "muted", category: "platform" };

export type AuditLog = {
  id: string;
  event_type: AuditEventType;
  actor_id: string | null;
  actor_label: string | null;
  target_type: string | null;
  target_id: string | null;
  target_label: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  success: boolean;
  created_at: string;
};

/**
 * Centralised, append-only audit write. Reusable across the app; IP / user-agent
 * are optional placeholders for future capture. Not wired into existing flows in
 * this phase — the foundation stands ready for callers to adopt.
 */
export async function recordAudit(input: {
  event: AuditEventType;
  actorId?: string;
  actorLabel?: string;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
  success?: boolean;
  ip?: string;
  userAgent?: string;
}): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_audit", {
    p_event: input.event,
    p_actor: input.actorId ?? null,
    p_actor_label: input.actorLabel ?? null,
    p_target_type: input.targetType ?? null,
    p_target_id: input.targetId ?? null,
    p_target_label: input.targetLabel ?? null,
    p_metadata: input.metadata ?? {},
    p_success: input.success ?? true,
    p_ip: input.ip ?? null,
    p_user_agent: input.userAgent ?? null,
  });
  if (error) return null;
  return data as string;
}

// ---------------------------------------------------------------- fetchers
export type AuditFilters = {
  eventType?: AuditEventType;
  actor?: string; // free-text match on actor label
  from?: string; // ISO date (inclusive)
  to?: string; // ISO date (inclusive)
  search?: string; // matches actor/target labels
  limit?: number;
};

/** Admin: the full platform history, filterable. RLS still applies (admin-all). */
export async function listAudit(filters: AuditFilters = {}): Promise<AuditLog[]> {
  const supabase = await createClient();
  let q = supabase.from("audit_logs").select("*").order("created_at", { ascending: false });

  if (filters.eventType) q = q.eq("event_type", filters.eventType);
  if (filters.actor) q = q.ilike("actor_label", `%${filters.actor}%`);
  if (filters.from) q = q.gte("created_at", filters.from);
  if (filters.to) q = q.lte("created_at", `${filters.to}T23:59:59.999Z`);
  if (filters.search) {
    // Strip PostgREST filter metacharacters so admin free-text can never alter
    // the query grammar (defensive; the query is already admin-scoped to audit_logs).
    const s = filters.search.replace(/[(),*:]/g, " ").trim();
    if (s) q = q.or(`actor_label.ilike.%${s}%,target_label.ilike.%${s}%`);
  }

  q = q.limit(filters.limit ?? 200);
  const { data } = await q;
  return (data ?? []) as AuditLog[];
}

/** Provider / patient: activity where the user is the actor or the target. */
export async function listUserActivity(userId: string, limit = 50): Promise<AuditLog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("*")
    .or(`actor_id.eq.${userId},target_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as AuditLog[];
}
