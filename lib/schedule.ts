import { createClient } from "@/lib/supabase/server";

/**
 * Central schedule logic. Every availability/exception calculation lives here so
 * date logic is never duplicated across pages, and so a FUTURE booking validator
 * can consume one set of pure helpers.
 *
 * IMPORTANT: nothing in this file is wired into slot generation. The slot engine
 * (get_available_slots) is unchanged and still derives slots from `availability`
 * minus `time_off` minus booked appointments. These helpers are additive and
 * display-only until booking validation deliberately adopts them.
 */

const CLINIC_TZ = "Asia/Kolkata";

export const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

// ---------------------------------------------------------------- types
export type WeeklyRule = {
  weekday: number; // 0 = Sunday
  start_time: string; // "09:00:00"
  end_time: string;
  slot_minutes: number;
};

export type ScheduleEventKind =
  | "full_day_leave"
  | "half_day_leave"
  | "vacation"
  | "public_holiday"
  | "clinic_closed"
  | "emergency_closure"
  | "custom_block"
  | "override";

export type ScheduleEvent = {
  id: string;
  doctor_id: string;
  kind: ScheduleEventKind;
  title: string | null;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  override_adds_hours: boolean | null;
  note: string | null;
  created_at: string;
};

export type EventCategory = "leave" | "closure" | "block" | "override";

// ---------------------------------------------------------------- taxonomy
const CATEGORY: Record<ScheduleEventKind, EventCategory> = {
  full_day_leave: "leave",
  half_day_leave: "leave",
  vacation: "leave",
  public_holiday: "closure",
  clinic_closed: "closure",
  emergency_closure: "closure",
  custom_block: "block",
  override: "override",
};

const KIND_LABEL: Record<ScheduleEventKind, string> = {
  full_day_leave: "Full day leave",
  half_day_leave: "Half day leave",
  vacation: "Vacation",
  public_holiday: "Public holiday",
  clinic_closed: "Clinic closed",
  emergency_closure: "Emergency closure",
  custom_block: "Blocked time",
  override: "One-off override",
};

/** Kinds a patient may see on the public profile (mirrors the DB read policy). */
export const PUBLIC_EVENT_KINDS: ScheduleEventKind[] = [
  "full_day_leave", "half_day_leave", "vacation",
  "public_holiday", "clinic_closed", "emergency_closure",
];

export const SCHEDULE_EVENT_KINDS = Object.keys(KIND_LABEL) as ScheduleEventKind[];

export const eventCategory = (k: ScheduleEventKind): EventCategory => CATEGORY[k];
export const eventKindLabel = (k: ScheduleEventKind): string => KIND_LABEL[k];

// ---------------------------------------------------------------- date helpers
const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  aStart < bEnd && aEnd > bStart;

/** Weekday index (0=Sun) for an instant, evaluated in the clinic's zone. */
export function clinicWeekday(at: Date = new Date()): number {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: CLINIC_TZ, weekday: "short" }).format(at);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
}

/** Human date in the clinic zone, e.g. "Mon, 3 Aug 2026". */
export function clinicDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TZ, weekday: "short", day: "numeric", month: "short", year: "numeric",
  }).format(d);
}

// ---------------------------------------------------------------- grouping
export type WeeklyDay = { weekday: number; name: string; off: boolean; sessions: WeeklyRule[] };

/** All seven days, each with its sessions (empty = off). Presentation-ready. */
export function groupWeekly(rules: WeeklyRule[]): WeeklyDay[] {
  return WEEKDAYS.map((name, weekday) => {
    const sessions = rules
      .filter((r) => r.weekday === weekday)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    return { weekday, name, off: sessions.length === 0, sessions };
  });
}

// ---------------------------------------------------------------- events
export type CategorizedEvents = {
  leave: ScheduleEvent[];
  closures: ScheduleEvent[];
  blocks: ScheduleEvent[];
  overrides: ScheduleEvent[];
};

/** Upcoming (not-yet-ended) events, split by category and sorted by start. */
export function categorizeUpcoming(events: ScheduleEvent[], now: Date = new Date()): CategorizedEvents {
  const t = now.getTime();
  const upcoming = events
    .filter((e) => new Date(e.ends_at).getTime() >= t)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  return {
    leave: upcoming.filter((e) => CATEGORY[e.kind] === "leave"),
    closures: upcoming.filter((e) => CATEGORY[e.kind] === "closure"),
    blocks: upcoming.filter((e) => CATEGORY[e.kind] === "block"),
    overrides: upcoming.filter((e) => CATEGORY[e.kind] === "override"),
  };
}

/** The active leave/closure event covering `at`, if any (for status display). */
export function activeAbsence(events: ScheduleEvent[], at: Date = new Date()): ScheduleEvent | null {
  const t = at.getTime();
  const active = events
    .filter((e) => CATEGORY[e.kind] === "leave" || CATEGORY[e.kind] === "closure")
    .filter((e) => new Date(e.starts_at).getTime() <= t && new Date(e.ends_at).getTime() >= t)
    .sort((a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime());
  return active[0] ?? null;
}

// ---------------------------------------------------------------- status
export type AvailabilityState =
  | "on_leave" | "closed" | "available_today" | "off_today";

export type AvailabilityStatus = {
  state: AvailabilityState;
  label: string;
  returningOn?: string; // clinic-formatted date, when absent
};

/**
 * The single availability-status derivation, reused by the provider dashboard,
 * admin view, and public profile. Display-only — it does not gate booking.
 */
export function availabilityStatus(input: {
  weeklyRules: WeeklyRule[];
  events: ScheduleEvent[];
  now?: Date;
}): AvailabilityStatus {
  const now = input.now ?? new Date();
  const absence = activeAbsence(input.events, now);
  if (absence) {
    const category = CATEGORY[absence.kind];
    return {
      state: category === "leave" ? "on_leave" : "closed",
      label: category === "leave" ? "On leave" : "Clinic closed",
      returningOn: clinicDate(absence.ends_at),
    };
  }

  const consultsToday = input.weeklyRules.some((r) => r.weekday === clinicWeekday(now));
  return consultsToday
    ? { state: "available_today", label: "Available today" }
    : { state: "off_today", label: "Not consulting today" };
}

// ---------------------------------------------------------------- FUTURE hook
/**
 * Reusable slot-eligibility check the booking validator can adopt LATER.
 * Returns true if a candidate slot collides with a leave, closure, block, or a
 * "close earlier / unavailable" override.
 *
 * NOT CALLED ANYWHERE YET. Booking behaviour is unchanged; this exists so future
 * validation calls one helper instead of re-deriving date math. Wiring it into
 * get_available_slots / the confirm action is a separate, deliberate step.
 */
export function isSlotBlocked(
  events: ScheduleEvent[],
  slotStartISO: string,
  slotEndISO: string
): boolean {
  const s = new Date(slotStartISO).getTime();
  const e = new Date(slotEndISO).getTime();
  return events.some((ev) => {
    // An override that ADDS hours never blocks; every other event removes time.
    if (ev.kind === "override" && ev.override_adds_hours) return false;
    return overlaps(s, e, new Date(ev.starts_at).getTime(), new Date(ev.ends_at).getTime());
  });
}

// ---------------------------------------------------------------- fetchers
export async function getWeeklyRules(doctorId: string): Promise<WeeklyRule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability")
    .select("weekday, start_time, end_time, slot_minutes")
    .eq("doctor_id", doctorId)
    .order("weekday")
    .order("start_time");
  return (data ?? []) as WeeklyRule[];
}

/** All of a provider's schedule events (owner/admin scope via RLS). */
export async function getScheduleEvents(doctorId: string): Promise<ScheduleEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("schedule_events")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("starts_at");
  return (data ?? []) as ScheduleEvent[];
}

/** Public-facing absences only (leave/closure) — respects the public RLS set. */
export async function getPublicAbsences(doctorId: string): Promise<ScheduleEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("schedule_events")
    .select("*")
    .eq("doctor_id", doctorId)
    .in("kind", PUBLIC_EVENT_KINDS)
    .gte("ends_at", new Date().toISOString())
    .order("starts_at");
  return (data ?? []) as ScheduleEvent[];
}
