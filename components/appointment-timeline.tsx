import { stateMeta, type TimelineEntry } from "@/lib/workflow";
import { WORKFLOW_TONES, workflowIcon } from "@/components/workflow-badge";

function ts(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Reusable appointment lifecycle timeline. Consumes buildTimeline() output, so
 * patient, doctor, and admin all render the same history from the same engine.
 */
export function AppointmentTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-control)] bg-[var(--bg-surface)] p-6 text-center text-[0.875rem] text-[var(--text-muted)]">
        No lifecycle history yet.
      </p>
    );
  }
  return (
    <ol className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
      {entries.map((e, i) => {
        const meta = stateMeta(e.state);
        const tone = WORKFLOW_TONES[meta.tone];
        const Icon = workflowIcon(e.state);
        const last = i === entries.length - 1;
        return (
          <li key={`${e.state}-${i}`} className="relative flex gap-3.5 pb-5 last:pb-0">
            {!last && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-[var(--border-subtle)]" aria-hidden />}
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: tone.bg }}>
              <Icon size={16} color={tone.fg} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2">
                <span className="text-[0.9375rem] font-medium text-[var(--text-primary)]">{meta.label}</span>
                {e.derived && (
                  <span className="rounded-[var(--radius-full)] bg-[var(--bg-sunken)] px-1.5 py-0.5 text-[0.625rem] font-medium text-[var(--text-muted)]">derived</span>
                )}
              </div>
              {e.note && <p className="mt-0.5 text-[0.8125rem] text-[var(--text-secondary)]">{e.note}</p>}
              <p className="tabular mt-1 text-[0.6875rem] text-[var(--text-disabled)]">
                {ts(e.at)}{e.actor ? ` · ${e.actor}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
