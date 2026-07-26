import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarX2 } from "lucide-react";
import { getMyDoctor } from "@/lib/doctor";
import { createClient } from "@/lib/supabase/server";
import { slotFull } from "@/lib/format";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
] as const;

function initials(name?: string): string {
  const parts = (name ?? "").split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "—";
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    booked: { bg: "var(--bg-brandSubtle)", fg: "var(--text-brand)", label: "Confirmed" },
    completed: { bg: "var(--bg-successSubtle)", fg: "var(--text-success)", label: "Completed" },
    cancelled: { bg: "var(--bg-dangerSubtle)", fg: "var(--text-danger)", label: "Cancelled" },
    no_show: { bg: "var(--bg-sunken)", fg: "var(--text-muted)", label: "Missed" },
  };
  const s = map[status] ?? map.completed;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] px-2.5 py-0.5 text-[0.75rem] font-medium"
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} aria-hidden />
      {s.label}
    </span>
  );
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const doctor = await getMyDoctor();
  if (!doctor) redirect("/dashboard");

  const { filter = "upcoming" } = await searchParams;
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  let query = supabase
    .from("appointments")
    .select("id, reference, starts_at, status, patient_name, patient_phone, reason")
    .eq("doctor_id", doctor.id);

  if (filter === "upcoming") query = query.eq("status", "booked").gte("starts_at", nowIso);
  else if (filter === "past") query = query.lt("starts_at", nowIso).neq("status", "cancelled");
  else if (filter === "cancelled") query = query.eq("status", "cancelled");

  const { data: appts } = await query.order("starts_at", {
    ascending: filter === "upcoming",
  });

  const count = appts?.length ?? 0;
  const TH = "sticky top-0 z-10 bg-[var(--bg-sunken)] px-4 py-3 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]";

  return (
    <main className="p-8">
      <header className="mb-5">
        <h1 className="text-[1.875rem] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
          Appointments
        </h1>
        <p className="mt-1 text-[0.9375rem] text-[var(--text-muted)]">
          Your upcoming and past consultations.
        </p>
      </header>

      {/* Segmented filters */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-[var(--radius-lg)] bg-[var(--bg-sunken)] p-1" style={{ width: "fit-content" }}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Link
              key={f.key}
              href={`/dashboard/appointments?filter=${f.key}`}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "rounded-[var(--radius-md)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-[0.8125rem] font-semibold text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
                  : "rounded-[var(--radius-md)] px-3.5 py-1.5 text-[0.8125rem] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <p className="mt-4 text-[0.8125rem] text-[var(--text-muted)]">
        <span className="tabular font-semibold text-[var(--text-secondary)]">{count}</span>{" "}
        {count === 1 ? "appointment" : "appointments"}
      </p>

      <div className="mt-3">
        {appts && appts.length > 0 ? (
          <div className="card overflow-hidden">
            <table className="w-full text-[0.9375rem]">
              <thead>
                <tr>
                  <th className={TH}>When</th>
                  <th className={TH}>Patient</th>
                  <th className={TH}>Phone</th>
                  <th className={TH}>Reason</th>
                  <th className={TH}>Status</th>
                  <th className={TH}></th>
                </tr>
              </thead>
              <tbody>
                {appts.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-sunken)]"
                  >
                    <td className="tabular whitespace-nowrap px-4 py-3.5 font-medium text-[var(--text-brand)]">
                      {slotFull(a.starts_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-semibold"
                          style={{ background: "var(--bg-brandSubtle)", color: "var(--text-brand)" }}
                          aria-hidden
                        >
                          {initials(a.patient_name)}
                        </span>
                        <span className="font-medium text-[var(--text-primary)]">{a.patient_name}</span>
                      </div>
                    </td>
                    <td className="tabular px-4 py-3.5 text-[var(--text-muted)]">{a.patient_phone || "—"}</td>
                    <td className="px-4 py-3.5 text-[var(--text-muted)]">{a.reason || "—"}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/dashboard/appointments/${a.id}`}
                        className="text-[0.8125rem] font-medium text-[var(--text-brand)] hover:underline"
                      >
                        Lifecycle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card flex flex-col items-center px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--bg-sunken)" }}>
              <CalendarX2 size={22} color="var(--text-muted)" aria-hidden />
            </span>
            <p className="mt-4 text-[1.0625rem] font-semibold text-[var(--text-primary)]">
              No {filter === "all" ? "" : filter} appointments
            </p>
            <p className="mt-1 text-[0.875rem] text-[var(--text-muted)]">Nothing to show in this view.</p>
          </div>
        )}
      </div>
    </main>
  );
}
