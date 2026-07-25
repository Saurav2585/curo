/**
 * The canonical appointment state machine — the ONE place that understands
 * appointment lifecycle states and transitions. Every surface (patient, doctor,
 * admin) and every future consumer (reminders, billing, analytics,
 * notifications) derives its state logic from here. Never duplicate status
 * logic elsewhere.
 *
 * This module is PURE (no server/DB imports) so it is safe to import anywhere,
 * including client components. Fetching and the authorised transition write live
 * in lib/workflow-server.ts.
 *
 * IMPORTANT: this engine is an OVERLAY. It does not change booking behaviour and
 * nothing here auto-transitions appointments. The existing appointments.status
 * remains the booking source of truth; `mapBaseStatus` bridges the two.
 */

export type WorkflowState =
  | "requested"
  | "confirmed"
  | "checked_in"
  | "in_consultation"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "no_show"
  | "follow_up_recommended";

export type WorkflowTone = "neutral" | "brand" | "info" | "success" | "danger" | "warning" | "muted";
export type WorkflowIcon =
  | "inbox" | "calendar-check" | "log-in" | "stethoscope" | "check-circle"
  | "x-circle" | "repeat" | "user-x" | "clipboard-plus";

export type StateMeta = {
  label: string;
  icon: WorkflowIcon;
  tone: WorkflowTone;
  description: string;
};

export const STATE_META: Record<WorkflowState, StateMeta> = {
  requested:            { label: "Requested",            icon: "inbox",           tone: "neutral", description: "Awaiting confirmation." },
  confirmed:            { label: "Confirmed",            icon: "calendar-check",  tone: "brand",   description: "Booked and confirmed." },
  checked_in:           { label: "Checked in",           icon: "log-in",          tone: "info",    description: "Patient has arrived." },
  in_consultation:      { label: "In consultation",      icon: "stethoscope",     tone: "info",    description: "Consultation underway." },
  completed:            { label: "Completed",            icon: "check-circle",    tone: "success", description: "Visit finished." },
  cancelled:            { label: "Cancelled",            icon: "x-circle",        tone: "danger",  description: "Appointment cancelled." },
  rescheduled:          { label: "Rescheduled",          icon: "repeat",          tone: "warning", description: "Moved to a new time." },
  no_show:              { label: "No show",              icon: "user-x",          tone: "muted",   description: "Patient did not attend." },
  follow_up_recommended:{ label: "Follow-up recommended",icon: "clipboard-plus",  tone: "success", description: "A follow-up is advised." },
};

/**
 * THE transition map. Illegal transitions are simply absent, so `canTransition`
 * makes them impossible. Keep this the single definition.
 */
export const WORKFLOW_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  requested:             ["confirmed", "cancelled"],
  confirmed:             ["checked_in", "cancelled", "rescheduled", "no_show"],
  checked_in:            ["in_consultation", "cancelled"],
  in_consultation:       ["completed"],
  completed:             ["follow_up_recommended"],
  rescheduled:           ["confirmed", "cancelled"],
  cancelled:             [],
  no_show:               [],
  follow_up_recommended: [],
};

export const ALL_WORKFLOW_STATES = Object.keys(STATE_META) as WorkflowState[];

export const stateMeta = (s: WorkflowState): StateMeta => STATE_META[s];

/** The states reachable from `state` in one legal step. */
export function allowedTransitions(state: WorkflowState): WorkflowState[] {
  return WORKFLOW_TRANSITIONS[state] ?? [];
}

/** Allowed next states with their metadata — convenient for action buttons. */
export function nextStates(state: WorkflowState): (StateMeta & { state: WorkflowState })[] {
  return allowedTransitions(state).map((s) => ({ state: s, ...STATE_META[s] }));
}

/** Whether a specific transition is legal. The only correct legality check. */
export function canTransition(from: WorkflowState, to: WorkflowState): boolean {
  return allowedTransitions(from).includes(to);
}

/** A state with no outgoing transitions ends the lifecycle. */
export function isTerminal(state: WorkflowState): boolean {
  return allowedTransitions(state).length === 0;
}

/** Bridge the existing appointments.status enum to a lifecycle state. */
export function mapBaseStatus(status: string): WorkflowState {
  switch (status) {
    case "completed": return "completed";
    case "cancelled": return "cancelled";
    case "no_show":   return "no_show";
    case "booked":
    default:          return "confirmed";
  }
}

export type LifecycleEvent = {
  id: string;
  appointment_id: string;
  from_state: WorkflowState | null;
  to_state: WorkflowState;
  actor_id: string | null;
  actor_label: string | null;
  note: string | null;
  created_at: string;
};

/**
 * The effective current state: the last recorded transition if any, otherwise
 * the mapped base status. This is how every surface agrees on "where is this
 * appointment now".
 */
export function currentState(input: { baseStatus: string; events: LifecycleEvent[] }): WorkflowState {
  if (input.events.length > 0) return input.events[input.events.length - 1].to_state;
  return mapBaseStatus(input.baseStatus);
}

export type TimelineEntry = {
  state: WorkflowState;
  at: string;
  actor?: string | null;
  note?: string | null;
  derived?: boolean; // true when synthesised from base status (no explicit event)
};

/**
 * A reusable, ordered timeline. When explicit lifecycle events exist they are
 * authoritative; otherwise a lightweight timeline is synthesised from the base
 * appointment status so legacy appointments still show a sensible history.
 */
export function buildTimeline(input: {
  createdAt: string;
  baseStatus: string;
  cancelledAt?: string | null;
  startsAt?: string | null;
  events: LifecycleEvent[];
}): TimelineEntry[] {
  if (input.events.length > 0) {
    return input.events.map((e) => ({
      state: e.to_state,
      at: e.created_at,
      actor: e.actor_label,
      note: e.note,
    }));
  }

  const base = mapBaseStatus(input.baseStatus);
  const entries: TimelineEntry[] = [
    { state: "confirmed", at: input.createdAt, note: "Appointment created", derived: true },
  ];

  if (base === "cancelled") {
    entries.push({ state: "cancelled", at: input.cancelledAt ?? input.createdAt, derived: true });
  } else if (base === "completed") {
    entries.push({ state: "completed", at: input.startsAt ?? input.createdAt, derived: true });
  } else if (base === "no_show") {
    entries.push({ state: "no_show", at: input.startsAt ?? input.createdAt, derived: true });
  }

  return entries;
}

/** A friendly "next step" hint for the patient view, or null when terminal. */
export function nextStepHint(state: WorkflowState): string | null {
  if (isTerminal(state)) return null;
  switch (state) {
    case "confirmed":       return "Arrive at the clinic and check in at reception.";
    case "checked_in":      return "The doctor will call you in for your consultation.";
    case "in_consultation": return "Your consultation is in progress.";
    case "completed":       return "Your provider may recommend a follow-up.";
    case "requested":       return "Waiting for the clinic to confirm your appointment.";
    case "rescheduled":     return "Your appointment is being moved to a new time.";
    default:                return null;
  }
}
