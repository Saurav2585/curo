import {
  Inbox, CalendarCheck, LogIn, Stethoscope, CheckCircle2, XCircle, Repeat, UserX, ClipboardPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { stateMeta, type WorkflowState, type WorkflowIcon, type WorkflowTone } from "@/lib/workflow";

const ICONS: Record<WorkflowIcon, LucideIcon> = {
  inbox: Inbox, "calendar-check": CalendarCheck, "log-in": LogIn, stethoscope: Stethoscope,
  "check-circle": CheckCircle2, "x-circle": XCircle, repeat: Repeat, "user-x": UserX,
  "clipboard-plus": ClipboardPlus,
};

export const WORKFLOW_TONES: Record<WorkflowTone, { bg: string; fg: string }> = {
  neutral: { bg: "var(--bg-sunken)", fg: "var(--text-secondary)" },
  brand: { bg: "var(--bg-brandSubtle)", fg: "var(--text-brand)" },
  info: { bg: "var(--bg-brandSubtle)", fg: "var(--text-brand)" },
  success: { bg: "var(--bg-successSubtle)", fg: "var(--text-success)" },
  danger: { bg: "var(--bg-dangerSubtle)", fg: "var(--text-danger)" },
  warning: { bg: "color-mix(in srgb, var(--color-amber-500) 14%, transparent)", fg: "var(--color-amber-500)" },
  muted: { bg: "var(--bg-sunken)", fg: "var(--text-muted)" },
};

export function workflowIcon(state: WorkflowState): LucideIcon {
  return ICONS[stateMeta(state).icon] ?? Inbox;
}

/** The canonical status pill for an appointment lifecycle state. */
export function WorkflowBadge({ state, size = "md" }: { state: WorkflowState; size?: "sm" | "md" }) {
  const meta = stateMeta(state);
  const tone = WORKFLOW_TONES[meta.tone];
  const Icon = workflowIcon(state);
  const pad = size === "sm" ? "px-2 py-0.5 text-[0.6875rem]" : "px-2.5 py-1 text-[0.75rem]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-full)] font-semibold ${pad}`}
      style={{ background: tone.bg, color: tone.fg }}
    >
      <Icon size={size === "sm" ? 12 : 13} aria-hidden />
      {meta.label}
    </span>
  );
}
