import { createClient } from "@/lib/supabase/server";
import {
  groupWeekly, categorizeUpcoming, availabilityStatus, clinicDate, eventKindLabel,
  type WeeklyRule, type ScheduleEvent,
} from "@/lib/schedule";
import { AvailabilityBadge } from "@/components/availability-status";

export const dynamic = "force-dynamic";

/**
 * Admin availability — READ ONLY. Admins can see each provider's current
 * availability status, upcoming leave, and schedule exceptions. There are no
 * edit controls here; the DB grants admins select-only on schedule_events.
 */
export default async function AdminAvailabilityPage() {
  const supabase = await createClient();
  const [{ data: doctors }, { data: rules }, { data: events }] = await Promise.all([
    supabase.from("doctors").select("id, full_name").order("full_name").limit(200),
    supabase.from("availability").select("doctor_id, weekday, start_time, end_time, slot_minutes"),
    supabase.from("schedule_events").select("*").order("starts_at"),
  ]);

  const rulesBy = new Map<string, WeeklyRule[]>();
  for (const r of (rules ?? []) as (WeeklyRule & { doctor_id: string })[]) {
    const list = rulesBy.get(r.doctor_id) ?? [];
    list.push(r);
    rulesBy.set(r.doctor_id, list);
  }
  const eventsBy = new Map<string, ScheduleEvent[]>();
  for (const e of (events ?? []) as ScheduleEvent[]) {
    const list = eventsBy.get(e.doctor_id) ?? [];
    list.push(e);
    eventsBy.set(e.doctor_id, list);
  }

  const rows = (doctors ?? []).map((d) => {
    const weeklyRules = rulesBy.get(d.id) ?? [];
    const evs = eventsBy.get(d.id) ?? [];
    const status = availabilityStatus({ weeklyRules, events: evs });
    const { leave, closures, blocks, overrides } = categorizeUpcoming(evs);
    const consultingDays = groupWeekly(weeklyRules).filter((w) => !w.off).length;
    const nextLeave = leave[0] ?? null;
    return { d, status, consultingDays, nextLeave, exceptions: closures.length + overrides.length, blocks: blocks.length };
  });

  return (
    <main className="p-8">
      <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">Availability</h1>
      <p className="text-[0.9375rem] text-[var(--text-muted)]">
        Provider availability, upcoming leave, and schedule exceptions. Read-only — availability is managed by providers.
      </p>

      <div className="mt-6 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
        <table className="w-full text-[0.875rem]">
          <thead>
            <tr className="bg-[var(--bg-sunken)] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[var(--text-muted)]">
              <th className="px-4 py-2.5 font-medium">Provider</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-center font-medium">Consulting days</th>
              <th className="px-4 py-2.5 font-medium">Next leave</th>
              <th className="px-4 py-2.5 text-center font-medium">Exceptions</th>
              <th className="px-4 py-2.5 text-center font-medium">Blocks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ d, status, consultingDays, nextLeave, exceptions, blocks }) => (
              <tr key={d.id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] align-top">
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{d.full_name}</td>
                <td className="px-4 py-3"><AvailabilityBadge status={status} showReturning={false} /></td>
                <td className="tabular px-4 py-3 text-center text-[var(--text-secondary)]">{consultingDays}/7</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {nextLeave
                    ? <span className="tabular">{eventKindLabel(nextLeave.kind)} · {clinicDate(nextLeave.starts_at)}</span>
                    : <span className="text-[var(--text-muted)]">—</span>}
                </td>
                <td className="tabular px-4 py-3 text-center text-[var(--text-secondary)]">{exceptions || <span className="text-[var(--text-muted)]">—</span>}</td>
                <td className="tabular px-4 py-3 text-center text-[var(--text-secondary)]">{blocks || <span className="text-[var(--text-muted)]">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[0.75rem] text-[var(--text-muted)]">
        Availability shown here is informational and does not affect slot generation or existing bookings.
      </p>
    </main>
  );
}
