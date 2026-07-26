import { redirect } from "next/navigation";
import { Clock, CalendarOff, Ban, ShieldAlert, Trash2, Plus } from "lucide-react";
import { getMyDoctor } from "@/lib/doctor";
import { getNextSlots } from "@/lib/queries";
import { slotTime } from "@/lib/format";
import {
  getWeeklyRules, getScheduleEvents, groupWeekly, categorizeUpcoming,
  availabilityStatus, clinicDate, eventKindLabel, SCHEDULE_EVENT_KINDS,
  type ScheduleEvent,
} from "@/lib/schedule";
import { AvailabilityBadge, NextAvailable } from "@/components/availability-status";
import { addScheduleEvent, deleteScheduleEvent } from "./actions";

export const dynamic = "force-dynamic";

function hhmm(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function eventRange(e: ScheduleEvent) {
  if (e.all_day) {
    const s = clinicDate(e.starts_at);
    const en = clinicDate(e.ends_at);
    return s === en ? s : `${s} → ${en}`;
  }
  return `${clinicDate(e.starts_at)}, ${slotTime(e.starts_at)} – ${slotTime(e.ends_at)}`;
}

function EventRow({ e }: { e: ScheduleEvent }) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--text-primary)]">{e.title || eventKindLabel(e.kind)}</span>
          <span className="rounded-[var(--radius-full)] bg-[var(--bg-sunken)] px-2 py-0.5 text-[0.6875rem] font-medium text-[var(--text-muted)]">
            {eventKindLabel(e.kind)}
            {e.kind === "override" && (e.override_adds_hours ? " · adds hours" : " · closes")}
          </span>
        </div>
        <p className="tabular mt-1 text-[0.8125rem] text-[var(--text-secondary)]">{eventRange(e)}</p>
        {e.note && <p className="mt-0.5 text-[0.8125rem] text-[var(--text-muted)]">{e.note}</p>}
      </div>
      <form action={deleteScheduleEvent}>
        <input type="hidden" name="id" value={e.id} />
        <button
          type="submit"
          aria-label="Remove"
          className="rounded-[var(--radius-md)] border border-[var(--border-control)] p-1.5 text-[var(--text-muted)] transition-colors hover:border-[var(--border-danger)] hover:text-[var(--text-danger)]"
        >
          <Trash2 size={15} aria-hidden />
        </button>
      </form>
    </li>
  );
}

function Section({
  title, icon: Icon, events, empty,
}: {
  title: string;
  icon: typeof Clock;
  events: ScheduleEvent[];
  empty: string;
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-[1.0625rem] font-semibold text-[var(--text-primary)]">
        <Icon size={17} color="var(--text-brand)" aria-hidden /> {title}
        <span className="tabular text-[0.8125rem] font-normal text-[var(--text-disabled)]">{events.length}</span>
      </h2>
      {events.length > 0 ? (
        <ul className="space-y-2">{events.map((e) => <EventRow key={e.id} e={e} />)}</ul>
      ) : (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-control)] bg-[var(--bg-surface)] p-4 text-[0.875rem] text-[var(--text-muted)]">
          {empty}
        </p>
      )}
    </section>
  );
}

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const doctor = await getMyDoctor();
  if (!doctor) redirect("/dashboard");
  const { ok, error } = await searchParams;

  const [weeklyRules, events, nextSlots] = await Promise.all([
    getWeeklyRules(doctor.id),
    getScheduleEvents(doctor.id),
    getNextSlots([doctor.id], 1),
  ]);

  const status = availabilityStatus({ weeklyRules, events });
  const week = groupWeekly(weeklyRules);
  const { leave, closures, blocks, overrides } = categorizeUpcoming(events);
  const nextIso = nextSlots[doctor.id]?.[0] ?? null;

  return (
    <main className="p-8">
      <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">Availability</h1>
      <p className="text-[0.9375rem] text-[var(--text-muted)]">
        Your weekly hours, leave, and blocked periods in one place. Booking still runs on your consulting hours — these are for planning.
      </p>

      {ok && (
        <p className="mt-4 max-w-3xl rounded-[var(--radius-md)] bg-[var(--bg-successSubtle)] px-4 py-2.5 text-[0.875rem] text-[var(--text-success)]">
          {ok === "added" ? "Schedule event added." : "Schedule event removed."}
        </p>
      )}
      {error && (
        <p className="mt-4 max-w-3xl rounded-[var(--radius-md)] bg-[var(--bg-dangerSubtle)] px-4 py-2.5 text-[0.875rem] text-[var(--text-danger)]">
          {error === "range"
            ? "End must be after start."
            : error === "expired"
              ? "Your trial has ended — renew your plan to update your schedule. Your existing schedule stays visible."
              : "Couldn't save that event — please check the fields."}
        </p>
      )}

      {/* Profile availability status */}
      <div className="mt-6 flex max-w-3xl flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.8125rem] text-[var(--text-muted)]">Profile availability status</p>
          <div className="mt-2"><AvailabilityBadge status={status} /></div>
        </div>
        <NextAvailable iso={nextIso} />
      </div>

      {/* Weekly schedule */}
      <section className="mt-8 max-w-3xl">
        <h2 className="mb-3 flex items-center gap-2 text-[1.0625rem] font-semibold text-[var(--text-primary)]">
          <Clock size={17} color="var(--text-brand)" aria-hidden /> Weekly schedule
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {week.map((d) => (
            <div key={d.weekday} className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--text-primary)]">{d.name}</span>
                {d.off && <span className="text-[0.8125rem] text-[var(--text-muted)]">Off</span>}
              </div>
              {!d.off && (
                <ul className="mt-1.5 space-y-1">
                  {d.sessions.map((s, i) => (
                    <li key={i} className="tabular text-[0.875rem] text-[var(--text-secondary)]">
                      {hhmm(s.start_time)} – {hhmm(s.end_time)}
                      <span className="ml-1 text-[0.75rem] text-[var(--text-muted)]">· {s.slot_minutes}m</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[0.75rem] text-[var(--text-muted)]">
          Weekly hours are edited under Schedule. Slot generation is unchanged.
        </p>
      </section>

      <div className="mt-8 grid max-w-3xl gap-8">
        <Section title="Upcoming leave" icon={CalendarOff} events={leave} empty="No upcoming leave." />
        <Section title="Upcoming exceptions" icon={ShieldAlert} events={[...closures, ...overrides]} empty="No holidays, closures, or overrides scheduled." />
        <Section title="Blocked periods" icon={Ban} events={blocks} empty="No blocked periods (e.g. lunch, meetings, surgery)." />
      </div>

      {/* Add event */}
      <section className="mt-10 max-w-3xl">
        <h2 className="mb-3 flex items-center gap-2 text-[1.0625rem] font-semibold text-[var(--text-primary)]">
          <Plus size={17} color="var(--text-brand)" aria-hidden /> Add a schedule event
        </h2>
        <form action={addScheduleEvent} className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-[0.875rem]">
              <span className="mb-1.5 block font-medium text-[var(--text-secondary)]">Type</span>
              <select name="kind" defaultValue="full_day_leave" className="w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 py-2 text-[var(--text-primary)]">
                {SCHEDULE_EVENT_KINDS.map((k) => (
                  <option key={k} value={k}>{eventKindLabel(k)}</option>
                ))}
              </select>
            </label>
            <label className="text-[0.875rem]">
              <span className="mb-1.5 block font-medium text-[var(--text-secondary)]">Title <span className="font-normal text-[var(--text-muted)]">(optional)</span></span>
              <input name="title" maxLength={80} placeholder="e.g. Lunch, Diwali, Surgery" className="w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-disabled)]" />
            </label>
            <label className="text-[0.875rem]">
              <span className="mb-1.5 block font-medium text-[var(--text-secondary)]">Start date</span>
              <input type="date" name="start_date" required className="w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 py-2 text-[var(--text-primary)]" />
            </label>
            <label className="text-[0.875rem]">
              <span className="mb-1.5 block font-medium text-[var(--text-secondary)]">End date <span className="font-normal text-[var(--text-muted)]">(defaults to start)</span></span>
              <input type="date" name="end_date" className="w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 py-2 text-[var(--text-primary)]" />
            </label>
            <label className="text-[0.875rem]">
              <span className="mb-1.5 block font-medium text-[var(--text-secondary)]">Start time</span>
              <input type="time" name="start_time" defaultValue="09:00" className="w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 py-2 text-[var(--text-primary)]" />
            </label>
            <label className="text-[0.875rem]">
              <span className="mb-1.5 block font-medium text-[var(--text-secondary)]">End time</span>
              <input type="time" name="end_time" defaultValue="10:00" className="w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 py-2 text-[var(--text-primary)]" />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <label className="flex items-center gap-2 text-[0.875rem] text-[var(--text-secondary)]">
              <input type="checkbox" name="all_day" /> All day (ignores the times above)
            </label>
            <label className="flex items-center gap-2 text-[0.875rem] text-[var(--text-secondary)]">
              For overrides:
              <select name="override_adds_hours" defaultValue="remove" className="rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-2 py-1 text-[var(--text-primary)]">
                <option value="remove">Closes / unavailable</option>
                <option value="add">Adds hours</option>
              </select>
            </label>
          </div>

          <label className="mt-4 block text-[0.875rem]">
            <span className="mb-1.5 block font-medium text-[var(--text-secondary)]">Note <span className="font-normal text-[var(--text-muted)]">(optional)</span></span>
            <input name="note" maxLength={160} className="w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 py-2 text-[var(--text-primary)]" />
          </label>

          <button type="submit" className="mt-5 rounded-[var(--radius-md)] px-5 py-2.5 text-[0.9375rem] font-medium" style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}>
            Add event
          </button>
          <p className="mt-3 text-[0.75rem] text-[var(--text-muted)]">
            These events are for planning and future booking validation. They do not change your bookable slots today.
          </p>
        </form>
      </section>
    </main>
  );
}
