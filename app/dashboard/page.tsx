import { Fragment } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, Users, Activity, XCircle, Clock } from "lucide-react";
import { getMyDoctor, clinicTzToday } from "@/lib/doctor";
import { createClient } from "@/lib/supabase/server";
import { getProviderSubscription } from "@/lib/subscription";
import { PromotionSlot } from "@/components/promotion-slot";
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
  tone = "brand",
  primary = false,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  failed?: boolean;
  tone?: "brand" | "neutral";
  primary?: boolean;
}) {
  const tint =
    tone === "brand"
      ? { bg: "var(--bg-brandSubtle)", fg: "var(--text-brand)" }
      : { bg: "var(--bg-sunken)", fg: "var(--text-muted)" };
  return (
    <div
      className="lift rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-5"
      style={{
        // Primary card carries the focal point: a brand-tinted ring vs. the
        // hairline neutral ring on the rest. Same size, re-weighted.
        boxShadow: primary
          ? "inset 0 0 0 1px var(--border-brand)"
          : "inset 0 0 0 1px var(--border-subtle)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[0.8125rem] text-[var(--text-muted)]">{label}</span>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: tint.bg }}
        >
          <Icon size={16} color={tint.fg} />
        </span>
      </div>
      {/* Failed load shows an em-dash, never 0 — a false zero reads as real data */}
      <p
        className={`tabular mt-3 font-bold leading-none text-[var(--text-primary)] ${
          primary ? "text-[2.5rem]" : "text-[1.75rem]"
        }`}
      >
        {failed ? "—" : value}
      </p>
      {sub && <p className="mt-1.5 text-[0.8125rem] text-[var(--text-muted)]">{sub}</p>}
    </div>
  );
}

/** Clinic-local hour, for session grouping. Presentation only. */
function clinicHour(iso: string): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }).format(new Date(iso))
  );
}
function sessionOf(iso: string): "Morning" | "Afternoon" | "Evening" {
  const h = clinicHour(iso);
  return h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
}

export default async function DashboardPage() {
  const doctor = await getMyDoctor();
  if (!doctor) redirect("/dashboard"); // layout handles the message

  const today = clinicTzToday();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sub = await getProviderSubscription(doctor.id, user!.id);

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

  // Next upcoming appointment (presentation emphasis only, from existing data).
  const nowMs = Date.now();
  const nextId = (appts ?? []).find(
    (a) => new Date(a.starts_at).getTime() >= nowMs
  )?.id;

  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());

  return (
    <main className="p-8">
      <header className="mb-6">
        <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">
          Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, {doctor.full_name.replace(/^Dr\.?\s+/i, "")}
        </h1>
        <p className="text-[0.9375rem] text-[var(--text-muted)]">
          {doctor.specialties?.name} · {doctor.clinics?.name}
        </p>
      </header>

      {/* Trial status card — quiet by default, emphasised under 7 days. Never a popup. */}
      {sub.onTrial && (
        <div
          className="mb-6 flex flex-col items-start justify-between gap-3 rounded-[var(--radius-lg)] border p-5 sm:flex-row sm:items-center"
          style={
            sub.trialUrgent
              ? { borderColor: "var(--color-amber-500)", background: "var(--bg-warnSubtle)" }
              : { borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }
          }
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ background: sub.trialUrgent ? "var(--bg-surface)" : "var(--bg-brandSubtle)" }}
            >
              <Clock size={20} color={sub.trialUrgent ? "var(--text-warn)" : "var(--text-brand)"} aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                Professional Trial ·{" "}
                <span className="tabular" style={sub.trialUrgent ? { color: "var(--text-warn)" } : undefined}>
                  {sub.daysRemaining} {sub.daysRemaining === 1 ? "day" : "days"} remaining
                </span>
              </p>
              <p className="text-[0.8125rem] text-[var(--text-muted)]">
                {sub.trialUrgent
                  ? "Your trial ends soon — choose a plan to keep analytics and reminders."
                  : "You're on the full Pro experience. No card required."}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/billing"
            className="shrink-0 rounded-[var(--radius-md)] px-4 py-2 text-[0.875rem] font-medium"
            style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
          >
            View plans
          </Link>
        </div>
      )}

      {/* Promotion slot — provider trial placement */}
      <div className="mb-6">
        <PromotionSlot placement="trial" plan={sub.plan} />
      </div>

      {/* KPIs — the "are we busy today?" answer, above the detail */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Booked today"
          value={`${stats?.booked_today ?? 0}`}
          sub={`of ${stats?.capacity_today ?? 0} slots`}
          icon={CalendarClock}
          failed={failed}
          primary
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
          tone="neutral"
        />
      </div>

      {/* Today's schedule */}
      <section className="mt-8">
        <div className="mb-3 flex items-baseline gap-2.5">
          <h2 className="text-[1.25rem] font-semibold text-[var(--text-primary)]">
            Today&apos;s schedule
          </h2>
          <span className="tabular text-[0.8125rem] text-[var(--text-muted)]">{todayLabel}</span>
        </div>

        {appts && appts.length > 0 ? (
          <table className="w-full border-collapse text-[0.9375rem]">
            <thead>
              <tr className="text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[var(--text-muted)]">
                <th className="border-b border-[var(--border-subtle)] px-3 pb-2 font-medium">Time</th>
                <th className="border-b border-[var(--border-subtle)] px-3 pb-2 font-medium">Patient</th>
                <th className="border-b border-[var(--border-subtle)] px-3 pb-2 font-medium">Reason</th>
                <th className="border-b border-[var(--border-subtle)] px-3 pb-2 text-right font-medium">Ref</th>
              </tr>
            </thead>
            <tbody>
              {appts.map((a, i) => {
                const isNext = a.id === nextId;
                const session = sessionOf(a.starts_at);
                const prevSession = i > 0 ? sessionOf(appts[i - 1].starts_at) : null;
                const showSession = session !== prevSession;

                return (
                  <Fragment key={a.id}>
                    {/* Session caption — quiet, whitespace-led, no fill */}
                    {showSession && (
                      <tr>
                        <td
                          colSpan={4}
                          className={`px-3 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] ${
                            i === 0 ? "pt-4" : "pt-7"
                          }`}
                        >
                          {session}
                        </td>
                      </tr>
                    )}
                    {/* Priority is carried by a teal rule + colour + weight —
                        no badge chrome. The next row simply reads as "live". */}
                    <tr className="group transition-colors">
                      <td
                        className="tabular whitespace-nowrap rounded-l-[var(--radius-sm)] py-2.5 pl-3 pr-3 font-semibold text-[var(--text-brand)] group-hover:bg-[var(--bg-sunken)]"
                        style={isNext ? { boxShadow: "inset 2px 0 0 0 var(--border-brand)" } : undefined}
                      >
                        {slotTime(a.starts_at)}
                      </td>
                      <td className="py-2.5 px-3 group-hover:bg-[var(--bg-sunken)]">
                        <span className={isNext ? "font-semibold text-[var(--text-primary)]" : "font-medium text-[var(--text-primary)]"}>
                          {a.patient_name}
                        </span>
                        {isNext && (
                          <span className="ml-2 text-[0.6875rem] font-medium uppercase tracking-wide text-[var(--text-brand)]">
                            Next
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--text-muted)] group-hover:bg-[var(--bg-sunken)]">
                        {a.reason || "—"}
                      </td>
                      <td className="tabular rounded-r-[var(--radius-sm)] py-2.5 px-3 text-right text-[0.75rem] text-[var(--text-disabled)] group-hover:bg-[var(--bg-sunken)]">
                        {a.reference}
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
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
