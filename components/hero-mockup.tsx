import { Check, ChevronRight } from "lucide-react";

/**
 * A faithful mockup of the real slot grid, built from the same tokens as the
 * live product. This is the hero visual — showing the product doing its one
 * magic trick, the way Linear/Stripe/Vercel lead with real UI rather than a
 * stock photo. Static and self-contained; no data, no interactivity.
 */

const MORNING = [
  { t: "9:00", s: "booked" },
  { t: "9:30", s: "free" },
  { t: "10:00", s: "free" },
  { t: "10:30", s: "booked" },
  { t: "11:00", s: "free" },
  { t: "11:30", s: "fast" },
] as const;

const EVENING = [
  { t: "5:00", s: "free" },
  { t: "5:30", s: "booked" },
  { t: "6:30", s: "fast" },
  { t: "7:00", s: "free" },
] as const;

function chip(state: string) {
  if (state === "booked")
    return { background: "var(--bg-sunken)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" };
  if (state === "fast")
    return { background: "var(--bg-warnSubtle)", color: "var(--text-warn)", border: "2px solid var(--color-amber-500)" };
  return { background: "var(--bg-surface)", color: "var(--text-brand)", border: "1px solid var(--border-brand)" };
}

function Chip({ t, s }: { t: string; s: string }) {
  return (
    <span
      className="tabular flex h-8 items-center justify-center rounded-[var(--radius-md)] text-[0.75rem] font-medium"
      style={chip(s)}
    >
      {t}
    </span>
  );
}

export function HeroMockup() {
  return (
    <div className="relative">
      {/* Main window */}
      <div className="ring-hairline shadow-ambient overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-surface)]">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-3">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--border-strong)" }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--border-strong)" }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--border-strong)" }} />
          </span>
          <span className="ml-2 text-[0.75rem] text-[var(--text-muted)]">curo.app / book</span>
        </div>

        <div className="p-5">
          <p className="text-[0.8125rem] text-[var(--text-muted)]">Dr. Ananya Sharma · General Physician</p>
          <p className="mt-0.5 text-[1.125rem] font-semibold text-[var(--text-primary)]">Wed, 22 Jul</p>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-3 text-[0.6875rem] text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-5 rounded-[3px]" style={chip("free")} /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-5 rounded-[3px]" style={chip("fast")} /> Filling fast
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-5 rounded-[3px]" style={chip("booked")} /> Booked
            </span>
          </div>

          <p className="mt-4 text-[0.6875rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Morning
          </p>
          <div className="mt-2 grid grid-cols-6 gap-1.5">
            {MORNING.map((s) => (
              <Chip key={s.t} t={s.t} s={s.s} />
            ))}
          </div>

          <p className="mt-4 text-[0.6875rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Evening
          </p>
          <div className="mt-2 grid grid-cols-6 gap-1.5">
            {EVENING.map((s) => (
              <Chip key={s.t} t={s.t} s={s.s} />
            ))}
          </div>
        </div>
      </div>

      {/* Floating "confirmed" card — the payoff */}
      <div className="glass ring-hairline float-slow absolute -bottom-5 -left-5 flex items-center gap-3 rounded-[var(--radius-lg)] p-3 shadow-ambient">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: "var(--bg-successSubtle)" }}
        >
          <Check size={18} color="var(--text-success)" aria-hidden />
        </span>
        <div>
          <p className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">Booked in 48s</p>
          <p className="tabular text-[0.6875rem] text-[var(--text-muted)]">Ref CU-27265B</p>
        </div>
      </div>

      {/* Floating reach card */}
      <div className="glass ring-hairline absolute -right-4 -top-4 hidden items-center gap-2 rounded-[var(--radius-lg)] p-3 shadow-ambient sm:flex">
        <div>
          <p className="tabular text-[1.25rem] font-bold leading-none text-[var(--text-primary)]">75%</p>
          <p className="text-[0.6875rem] text-[var(--text-muted)]">slots filled today</p>
        </div>
        <ChevronRight size={16} color="var(--text-muted)" aria-hidden />
      </div>
    </div>
  );
}
