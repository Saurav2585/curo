import { CalendarClock } from "lucide-react";
import type { AvailabilityStatus } from "@/lib/schedule";
import { slotDay, slotTime } from "@/lib/format";

type Tone = { bg: string; fg: string };

const TONES: Record<AvailabilityStatus["state"], Tone> = {
  available_today: { bg: "var(--bg-successSubtle)", fg: "var(--text-success)" },
  on_leave: { bg: "color-mix(in srgb, var(--color-amber-500) 14%, transparent)", fg: "var(--color-amber-500)" },
  closed: { bg: "var(--bg-dangerSubtle)", fg: "var(--text-danger)" },
  off_today: { bg: "var(--bg-sunken)", fg: "var(--text-muted)" },
};

/**
 * Reusable availability badge. Renders the derived status (Available today /
 * On leave / Clinic closed / Not consulting today) with an optional "returning
 * on" note. Display-only; shared by dashboard, admin, and public profile.
 */
export function AvailabilityBadge({
  status,
  showReturning = true,
}: {
  status: AvailabilityStatus;
  showReturning?: boolean;
}) {
  const tone = TONES[status.state];
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] px-2.5 py-0.5 text-[0.75rem] font-semibold"
        style={{ background: tone.bg, color: tone.fg }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.fg }} aria-hidden />
        {status.label}
      </span>
      {showReturning && status.returningOn && (
        <span className="text-[0.8125rem] text-[var(--text-muted)]">
          Returning {status.returningOn}
        </span>
      )}
    </span>
  );
}

/** "Next available" line for a concrete upcoming slot. */
export function NextAvailable({ iso }: { iso: string | null }) {
  if (!iso) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[0.875rem] text-[var(--text-muted)]">
        <CalendarClock size={15} aria-hidden /> No online slots in the next two weeks
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.875rem] text-[var(--text-secondary)]">
      <CalendarClock size={15} color="var(--text-brand)" aria-hidden />
      Next available <span className="font-medium text-[var(--text-primary)]">{slotDay(iso)}</span>
      <span className="tabular text-[var(--text-muted)]">{slotTime(iso)}</span>
    </span>
  );
}
