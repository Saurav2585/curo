/**
 * All times render in the clinic's zone, never the viewer's or the server's.
 *
 * This matters more than it looks: Vercel's servers run in UTC, so formatting
 * with the platform default would show a 10:30 IST slot as 05:00 on the server
 * render and 10:30 after hydration. Pinning the zone kills that whole class of bug.
 */
const CLINIC_TZ = "Asia/Kolkata";

function fmt(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: CLINIC_TZ, ...options }).format(
    new Date(iso)
  );
}

/** "10:30 am" */
export const slotTime = (iso: string) =>
  fmt(iso, { hour: "numeric", minute: "2-digit", hour12: true });

/** "Wed 22 Jul" */
export const slotDay = (iso: string) =>
  fmt(iso, { weekday: "short", day: "numeric", month: "short" });

/** "Wed 22 Jul, 10:30 am" */
export const slotFull = (iso: string) => `${slotDay(iso)}, ${slotTime(iso)}`;

/** Today / Tomorrow / Wed 22 Jul — friendlier on a date strip. */
export function relativeDay(iso: string): string {
  const today = fmt(new Date().toISOString(), { day: "numeric", month: "short" });
  const tomorrow = fmt(
    new Date(Date.now() + 86_400_000).toISOString(),
    { day: "numeric", month: "short" }
  );
  const target = fmt(iso, { day: "numeric", month: "short" });

  if (target === today) return "Today";
  if (target === tomorrow) return "Tomorrow";
  return slotDay(iso);
}

export const formatFee = (fee: number) =>
  `₹${Number(fee).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
