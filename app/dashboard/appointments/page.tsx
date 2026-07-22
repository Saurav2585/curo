import Link from "next/link";
import { redirect } from "next/navigation";
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    booked: { bg: "var(--bg-brandSubtle)", fg: "var(--text-brand)", label: "Confirmed" },
    completed: { bg: "var(--bg-sunken)", fg: "var(--text-muted)", label: "Completed" },
    cancelled: { bg: "var(--bg-dangerSubtle)", fg: "var(--text-danger)", label: "Cancelled" },
    no_show: { bg: "var(--bg-sunken)", fg: "var(--text-muted)", label: "Missed" },
  };
  const s = map[status] ?? map.completed;
  return (
    <span
      className="rounded-[var(--radius-full)] px-2.5 py-0.5 text-[0.75rem] font-medium"
      style={{ background: s.bg, color: s.fg }}
    >
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

  return (
    <main className="p-8">
      <h1 className="text-[2rem] font-bold tracking-tight text-[var(--text-primary)]">
        Appointments
      </h1>

      <div className="mt-4 flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/dashboard/appointments?filter=${f.key}`}
            className="rounded-[var(--radius-full)] border px-3.5 py-1.5 text-[0.8125rem] font-medium"
            style={
              filter === f.key
                ? { background: "var(--bg-brand)", borderColor: "var(--bg-brand)", color: "var(--text-onBrand)" }
                : { background: "var(--bg-surface)", borderColor: "var(--border-control)", color: "var(--text-secondary)" }
            }
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {appts && appts.length > 0 ? (
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
            <table className="w-full text-[0.9375rem]">
              <thead>
                <tr className="bg-[var(--bg-sunken)] text-left text-[0.8125rem] text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {appts.map((a) => (
                  <tr key={a.id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                    <td className="tabular whitespace-nowrap px-4 py-3 text-[var(--text-primary)]">
                      {slotFull(a.starts_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                      {a.patient_name}
                    </td>
                    <td className="tabular px-4 py-3 text-[var(--text-muted)]">
                      {a.patient_phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{a.reason || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center">
            <p className="text-[1.125rem] font-medium text-[var(--text-primary)]">
              No {filter === "all" ? "" : filter} appointments
            </p>
            <p className="mt-1 text-[var(--text-muted)]">
              Nothing to show in this view.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
