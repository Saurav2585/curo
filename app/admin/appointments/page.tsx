import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { slotFull } from "@/lib/format";
import { currentState, type LifecycleEvent } from "@/lib/workflow";
import { WorkflowBadge } from "@/components/workflow-badge";

export const dynamic = "force-dynamic";

/**
 * Admin workflow viewer — READ ONLY. Platform-wide appointments with their
 * canonical lifecycle state (derived from the same engine every surface uses).
 * There are no transition controls here; admins observe, they do not act.
 */
export default async function AdminAppointmentsPage() {
  const supabase = await createClient();
  const { data: appts } = await supabase
    .from("appointments")
    .select("id, reference, starts_at, status, patient_name, doctors ( full_name )")
    .order("starts_at", { ascending: false })
    .limit(100);

  const ids = (appts ?? []).map((a) => a.id);
  const eventsById = new Map<string, LifecycleEvent[]>();
  if (ids.length > 0) {
    const { data: events } = await supabase
      .from("appointment_lifecycle_events")
      .select("*")
      .in("appointment_id", ids)
      .order("created_at", { ascending: true });
    for (const e of (events ?? []) as LifecycleEvent[]) {
      const list = eventsById.get(e.appointment_id) ?? [];
      list.push(e);
      eventsById.set(e.appointment_id, list);
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">Appointments</h1>
      <p className="text-[0.9375rem] text-[var(--text-muted)]">
        Platform-wide lifecycle overview. Read-only — transition history is managed by providers.
      </p>

      <div className="mt-6 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
        <table className="w-full text-[0.875rem]">
          <thead>
            <tr className="bg-[var(--bg-sunken)] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[var(--text-muted)]">
              <th className="px-4 py-2.5 font-medium">When</th>
              <th className="px-4 py-2.5 font-medium">Patient</th>
              <th className="px-4 py-2.5 font-medium">Provider</th>
              <th className="px-4 py-2.5 font-medium">Lifecycle state</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(appts ?? []).map((a) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const provider = (a as any).doctors?.full_name ?? "—";
              const state = currentState({ baseStatus: a.status, events: eventsById.get(a.id) ?? [] });
              return (
                <tr key={a.id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  <td className="tabular whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">{slotFull(a.starts_at)}</td>
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{a.patient_name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{provider}</td>
                  <td className="px-4 py-3"><WorkflowBadge state={state} size="sm" /></td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/appointments/${a.id}`} className="text-[0.8125rem] font-medium text-[var(--text-brand)] hover:underline">
                      History
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
