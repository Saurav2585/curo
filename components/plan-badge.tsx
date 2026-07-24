import type { PlanId, PlanState } from "@/lib/entitlements";
import { planName } from "@/lib/entitlements";

/** Tone per plan, from existing tokens only. */
const PLAN_TONE: Record<string, { bg: string; fg: string }> = {
  free:       { bg: "var(--bg-sunken)",        fg: "var(--text-muted)" },
  care_plus:  { bg: "var(--bg-brandSubtle)",   fg: "var(--text-brand)" },
  trial:      { bg: "var(--bg-warnSubtle)",    fg: "var(--text-warn)" },
  pro:        { bg: "var(--bg-brandSubtle)",   fg: "var(--text-brand)" },
  clinic:     { bg: "var(--bg-brandSubtle)",   fg: "var(--text-brand)" },
  enterprise: { bg: "var(--bg-inverse)",       fg: "var(--text-onInverse)" },
};

/** Reusable plan chip: Free · Care+ · Trial · Professional · Clinic Pro · Enterprise. */
export function PlanBadge({ plan }: { plan: PlanId }) {
  const tone = PLAN_TONE[plan] ?? PLAN_TONE.free;
  return (
    <span
      className="inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5 text-[0.6875rem] font-semibold"
      style={{ background: tone.bg, color: tone.fg }}
    >
      {planName(plan)}
    </span>
  );
}

/** Reusable plan-state chip: Trial · Active · Expiring soon · Grace period · Expired · Cancelled. */
const STATE_UI: Record<PlanState, { label: string; bg: string; fg: string }> = {
  trial:         { label: "Trial",         bg: "var(--bg-brandSubtle)",   fg: "var(--text-brand)" },
  active:        { label: "Active",         bg: "var(--bg-successSubtle)", fg: "var(--text-success)" },
  expiring_soon: { label: "Expiring soon",  bg: "var(--bg-warnSubtle)",    fg: "var(--text-warn)" },
  grace_period:  { label: "Grace period",   bg: "var(--bg-warnSubtle)",    fg: "var(--text-warn)" },
  expired:       { label: "Expired",        bg: "var(--bg-dangerSubtle)",  fg: "var(--text-danger)" },
  cancelled:     { label: "Cancelled",      bg: "var(--bg-sunken)",        fg: "var(--text-muted)" },
};

export function PlanStatus({ state }: { state: PlanState }) {
  const s = STATE_UI[state] ?? STATE_UI.active;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] px-2.5 py-0.5 text-[0.6875rem] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} aria-hidden />
      {s.label}
    </span>
  );
}
