import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { slotFull } from "@/lib/format";
import { getLifecycleEvents } from "@/lib/workflow-server";
import { currentState, buildTimeline, isTerminal, stateMeta } from "@/lib/workflow";
import { WorkflowBadge } from "@/components/workflow-badge";
import { AppointmentTimeline } from "@/components/appointment-timeline";

export const dynamic = "force-dynamic";

/** Admin read-only workflow detail: current state + full transition history. */
export default async function AdminAppointmentWorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select("id, reference, starts_at, status, patient_name, created_at, cancelled_at, doctors ( full_name )")
    .eq("id", id)
    .maybeSingle();
  if (!appt) notFound();

  const events = await getLifecycleEvents(id);
  const state = currentState({ baseStatus: appt.status, events });
  const timeline = buildTimeline({
    createdAt: appt.created_at,
    baseStatus: appt.status,
    cancelledAt: appt.cancelled_at,
    startsAt: appt.starts_at,
    events,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provider = (appt as any).doctors?.full_name ?? "—";

  return (
    <main className="p-8">
      <Link href="/admin/appointments" className="inline-flex items-center gap-1 text-[0.875rem] text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
        <ChevronLeft size={16} /> Appointments
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">{appt.patient_name}</h1>
          <p className="tabular text-[0.9375rem] text-[var(--text-muted)]">{slotFull(appt.starts_at)} · {provider} · Ref {appt.reference}</p>
        </div>
        <WorkflowBadge state={state} />
      </div>

      <div className="mt-6 grid max-w-3xl gap-6 lg:grid-cols-2">
        <section className="ring-hairline rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-5">
          <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">Current state</p>
          <div className="mt-3"><WorkflowBadge state={state} /></div>
          <p className="mt-2 text-[0.875rem] text-[var(--text-secondary)]">{stateMeta(state).description}</p>
          <p className="mt-1 text-[0.8125rem] text-[var(--text-muted)]">
            {isTerminal(state) ? "Final state — no further transitions." : "Active — further transitions are possible."}
          </p>
          <p className="mt-4 border-t border-[var(--border-subtle)] pt-3 text-[0.75rem] text-[var(--text-muted)]">
            Read-only. Admins observe workflow; providers record transitions.
          </p>
        </section>

        <section>
          <p className="mb-2 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">Transition history</p>
          <AppointmentTimeline entries={timeline} />
        </section>
      </div>
    </main>
  );
}
