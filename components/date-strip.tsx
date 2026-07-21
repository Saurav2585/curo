import Link from "next/link";

/**
 * Fourteen days, horizontally scrollable. Server-rendered links rather than
 * client state — the chosen date belongs in the URL so it can be shared,
 * bookmarked and restored on back.
 */
export function DateStrip({
  doctorSlug,
  selectedDate,
  days = 14,
}: {
  doctorSlug: string;
  selectedDate: string; // YYYY-MM-DD
  days?: number;
}) {
  const today = new Date();

  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    return {
      iso,
      weekday: d.toLocaleDateString("en-IN", { weekday: "short" }),
      day: d.getDate(),
      month: d.toLocaleDateString("en-IN", { month: "short" }),
      isToday: i === 0,
    };
  });

  return (
    <div className="-mx-6 overflow-x-auto px-6 pb-2">
      <ul className="flex gap-2">
        {dates.map((d) => {
          const active = d.iso === selectedDate;
          return (
            <li key={d.iso}>
              <Link
                href={`/doctors/${doctorSlug}/book?date=${d.iso}`}
                aria-current={active ? "date" : undefined}
                className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[var(--radius-md)] border transition-colors"
                style={
                  active
                    ? {
                        background: "var(--bg-brand)",
                        borderColor: "var(--bg-brand)",
                        color: "var(--text-onBrand)",
                      }
                    : {
                        background: "var(--bg-surface)",
                        borderColor: "var(--border-control)",
                        color: "var(--text-secondary)",
                      }
                }
              >
                <span className="text-[0.75rem]">
                  {d.isToday ? "Today" : d.weekday}
                </span>
                <span className="tabular text-[1.25rem] font-semibold leading-tight">
                  {d.day}
                </span>
                <span className="text-[0.6875rem] opacity-80">{d.month}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
