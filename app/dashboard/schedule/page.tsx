import { redirect } from "next/navigation";
import { Clock, Plane } from "lucide-react";
import { getMyDoctor } from "@/lib/doctor";
import { createClient } from "@/lib/supabase/server";
import { slotFull } from "@/lib/format";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function hhmm(t: string) {
  // "09:00:00" -> "9:00 am"
  const [h, m] = t.split(":").map(Number);
  const ampm = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default async function SchedulePage() {
  const doctor = await getMyDoctor();
  if (!doctor) redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: rules }, { data: timeOff }] = await Promise.all([
    supabase
      .from("availability")
      .select("weekday, start_time, end_time, slot_minutes")
      .eq("doctor_id", doctor.id)
      .order("weekday")
      .order("start_time"),
    supabase
      .from("time_off")
      .select("starts_at, ends_at, reason")
      .eq("doctor_id", doctor.id)
      .gte("ends_at", new Date().toISOString())
      .order("starts_at"),
  ]);

  // Group availability rules by weekday
  const byDay = new Map<number, { start_time: string; end_time: string; slot_minutes: number }[]>();
  for (const r of rules ?? []) {
    const list = byDay.get(r.weekday) ?? [];
    list.push(r);
    byDay.set(r.weekday, list);
  }

  return (
    <main className="p-8">
      <h1 className="text-[2rem] font-bold tracking-tight text-[var(--text-primary)]">
        Consulting hours
      </h1>
      <p className="mt-1 text-[var(--text-muted)]">
        Slots are generated from these rules — patients only ever see real,
        bookable times.
      </p>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {WEEKDAYS.map((name, weekday) => {
          const dayRules = byDay.get(weekday) ?? [];
          const consulting = dayRules.length > 0;
          return (
            <div
              key={weekday}
              className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--text-primary)]">{name}</span>
                {!consulting && (
                  <span className="text-[0.8125rem] text-[var(--text-muted)]">Not consulting</span>
                )}
              </div>

              {consulting && (
                <ul className="mt-2 space-y-1.5">
                  {dayRules.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-[0.9375rem] text-[var(--text-secondary)]"
                    >
                      <Clock size={14} color="var(--text-brand)" aria-hidden />
                      <span className="tabular">
                        {hhmm(r.start_time)} – {hhmm(r.end_time)}
                      </span>
                      <span className="text-[0.8125rem] text-[var(--text-muted)]">
                        · {r.slot_minutes} min slots
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Time off */}
      <section className="mt-8">
        <h2 className="mb-3 text-[1.25rem] font-semibold text-[var(--text-primary)]">
          Time off
        </h2>
        {timeOff && timeOff.length > 0 ? (
          <ul className="space-y-2">
            {timeOff.map((t, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4"
              >
                <Plane size={16} color="var(--text-muted)" aria-hidden />
                <div>
                  <p className="tabular font-medium text-[var(--text-primary)]">
                    {slotFull(t.starts_at)} – {slotFull(t.ends_at)}
                  </p>
                  {t.reason && (
                    <p className="text-[0.8125rem] text-[var(--text-muted)]">{t.reason}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-[var(--text-muted)]">
            No upcoming time off scheduled.
          </p>
        )}
      </section>
    </main>
  );
}
