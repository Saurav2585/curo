import type { ComponentType } from "react";
import { redirect } from "next/navigation";
import { CalendarClock, Users, Activity, XCircle } from "lucide-react";
import { getMyDoctor, clinicTzToday } from "@/lib/doctor";
import { createClient } from "@/lib/supabase/server";
import { slotTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type Stats = {
  booked_today: number;
  capacity_today: number;
  utilisation_pct: number;
  cancelled_today: number;
  week_booked: number;
};

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  failed,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  failed?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-center justify-between">
        <span className="text-[0.8125rem] text-[var(--text-muted)]">{label}</span>
        <Icon size={16} color="var(--text-muted)" />
      </div>
      {/* Failed load shows an em-dash, never 0 — a false zero reads as real data */}
      <p className="tabular mt-2 text-[2rem] font-bold leading-none text-[var(--text-primary)]">
        {failed ? "—" : value}
      </p>
      {sub && <p className="mt-1 text-[0.8125rem] text-[var(--text-muted)]">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const doctor = await getMyDoctor();
  if (!doctor) redirect("/dashboard"); // layout handles the message

  const today = clinicTzToday();
  const supabase = await createClient();

  const [{ data: statsRows, error: statsError }, { data: appts }] = await Promise.all([
    supabase.rpc("doctor_day_stats", { p_doctor_id: doctor.id, p_date: today }),
    supabase
      .from("appointments")
      .select("id, reference, starts_at, status, patient_name, reason")
      .eq("doctor_id", doctor.id)
      .eq("status", "booked")
      .gte("starts_at", `${today}T00:00:00+05:30`)
      .lte("starts_at", `${today}T23:59:59+05:30`)
      .order("starts_at"),
  ]);

  const stats = (statsRows?.[0] ?? null) as Stats | null;
  const failed = !!statsError || !stats;

  return (
    <main className="p-8">
      <header className="mb-6">
        <h1 className="text-[2rem] font-bold tracking-tight text-[var(--text-primary)]">
          Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, {doctor.full_name.replace(/^Dr\.?\s+/i, "")}
        </h1>
        <p className="text-[var(--text-muted)]">
          {doctor.specialties?.name} · {doctor.clinics?.name}
        </p>
      </header>

      {/* KPIs — the "are we busy today?" answer, above the detail */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Booked today"
          value={`${stats?.booked_today ?? 0}`}
          sub={`of ${stats?.capacity_today ?? 0} slots`}
          icon={CalendarClock}
          failed={failed}
        />
        <KpiCard
          label="Utilisation"
          value={`${stats?.utilisation_pct ?? 0}%`}
          sub="of today's capacity"
          icon={Activity}
          failed={failed}
        />
        <KpiCard
          label="This week"
          value={`${stats?.week_booked ?? 0}`}
          sub="appointments booked"
          icon={Users}
          failed={failed}
        />
        <KpiCard
          label="Cancelled today"
          value={`${stats?.cancelled_today ?? 0}`}
          icon={XCircle}
          failed={failed}
        />
      </div>

      {/* Today's schedule */}
      <section className="mt-8">
        <h2 className="mb-3 text-[1.25rem] font-semibold text-[var(--text-primary)]">
          Today&apos;s schedule
        </h2>

        {appts && appts.length > 0 ? (
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
            <table className="w-full text-[0.9375rem]">
              <thead>
                <tr className="bg-[var(--bg-sunken)] text-left text-[0.8125rem] text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Ref</th>
                </tr>
              </thead>
              <tbody>
                {appts.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                  >
                    <td className="tabular whitespace-nowrap px-4 py-3 font-medium text-[var(--text-primary)]">
                      {slotTime(a.starts_at)}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{a.patient_name}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {a.reason || "—"}
                    </td>
                    <td className="tabular px-4 py-3 text-[0.8125rem] text-[var(--text-muted)]">
                      {a.reference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty state */
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center">
            <p className="text-[1.125rem] font-medium text-[var(--text-primary)]">
              Nothing booked today
            </p>
            <p className="mt-1 text-[var(--text-muted)]">
              {stats?.week_booked ?? 0} appointments across the week.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
