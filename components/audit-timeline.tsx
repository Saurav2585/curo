import {
  LogIn, LogOut, UserCog, KeyRound, CalendarPlus, CalendarX2, CalendarCheck,
  FileText, Check, X, Ban, CreditCard, Tag, Eye, Star, EyeOff, Clock, CheckCircle2, XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { auditMeta, type AuditIcon, type AuditTone, type AuditLog } from "@/lib/audit";

const ICONS: Record<AuditIcon, LucideIcon> = {
  "log-in": LogIn, "log-out": LogOut, "user-pen": UserCog, key: KeyRound,
  "calendar-plus": CalendarPlus, "calendar-x": CalendarX2, "calendar-check": CalendarCheck,
  "file-text": FileText, check: Check, x: X, ban: Ban, "credit-card": CreditCard,
  tag: Tag, eye: Eye, star: Star, "eye-off": EyeOff, clock: Clock,
};

const TONES: Record<AuditTone, { bg: string; fg: string }> = {
  brand: { bg: "var(--bg-brandSubtle)", fg: "var(--text-brand)" },
  success: { bg: "var(--bg-successSubtle)", fg: "var(--text-success)" },
  danger: { bg: "var(--bg-dangerSubtle)", fg: "var(--text-danger)" },
  warning: { bg: "color-mix(in srgb, var(--color-amber-500) 14%, transparent)", fg: "var(--color-amber-500)" },
  muted: { bg: "var(--bg-sunken)", fg: "var(--text-muted)" },
};

export function auditTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export function AuditOutcomeBadge({ success }: { success: boolean }) {
  const tone = success
    ? { bg: "var(--bg-successSubtle)", fg: "var(--text-success)", label: "Success", Icon: CheckCircle2 }
    : { bg: "var(--bg-dangerSubtle)", fg: "var(--text-danger)", label: "Failed", Icon: XCircle };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-[var(--radius-full)] px-2 py-0.5 text-[0.6875rem] font-medium"
      style={{ background: tone.bg, color: tone.fg }}
    >
      <tone.Icon size={12} aria-hidden /> {tone.label}
    </span>
  );
}

/** One entry — icon dot, label, actor→target, metadata, timestamp, outcome. */
export function AuditEntry({ entry }: { entry: AuditLog }) {
  const meta = auditMeta(entry.event_type);
  const Icon = ICONS[meta.icon] ?? Clock;
  const tone = TONES[meta.tone];
  const metaBits = Object.entries(entry.metadata ?? {});

  return (
    <li className="relative flex gap-3.5 pb-5 last:pb-0">
      {/* connector line */}
      <span className="absolute left-[15px] top-8 bottom-0 w-px bg-[var(--border-subtle)]" aria-hidden />
      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: tone.bg }}>
        <Icon size={16} color={tone.fg} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[0.9375rem] font-medium text-[var(--text-primary)]">{meta.label}</span>
          {!entry.success && <AuditOutcomeBadge success={false} />}
        </div>
        <p className="mt-0.5 text-[0.8125rem] text-[var(--text-muted)]">
          {entry.actor_label ?? "System"}
          {entry.target_label && entry.target_label !== entry.actor_label && (
            <>
              <span className="mx-1.5 text-[var(--text-disabled)]">→</span>
              {entry.target_label}
            </>
          )}
        </p>
        {metaBits.length > 0 && (
          <p className="mt-1 text-[0.75rem] text-[var(--text-muted)]">
            {metaBits.map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`).join(" · ")}
          </p>
        )}
        <p className="tabular mt-1 text-[0.6875rem] text-[var(--text-disabled)]">{auditTimestamp(entry.created_at)}</p>
      </div>
    </li>
  );
}

/** Reusable activity timeline, shared by patient, provider, and admin surfaces. */
export function AuditTimeline({ entries, emptyText }: { entries: AuditLog[]; emptyText: string }) {
  if (entries.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-control)] bg-[var(--bg-surface)] p-8 text-center text-[0.875rem] text-[var(--text-muted)]">
        {emptyText}
      </p>
    );
  }
  return (
    <ol className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
      {entries.map((e) => <AuditEntry key={e.id} entry={e} />)}
    </ol>
  );
}
