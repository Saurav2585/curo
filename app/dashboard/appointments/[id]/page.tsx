import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getMyDoctor } from "@/lib/doctor";
import { createClient } from "@/lib/supabase/server";
import { slotFull } from "@/lib/format";
import { getLifecycleEvents } from "@/lib/workflow-server";
import { currentState, buildTimeline, nextStates, isTerminal, stateMeta } from "@/lib/workflow";
import { WorkflowBadge, workflowIcon, WORKFLOW_TONES } from "@/components/workflow-badge";
import { AppointmentTimeline } from "@/components/appointment-timeline";
import { transitionAppointment } from "./actions";

export const dynamic = "force-dynamic";

export default async function DoctorAppointmentLifecyclePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const doctor = await getMyDoctor();
  if (!doctor) redirect("/dashboard");
  const { id } = await params;
  const { ok, error } = await searchParams;

  const supabase = await createClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select("id, reference, starts_at, status, patient_name, reason, created_at, cancelled_at")
    .eq("id", id)
    .eq("doctor_id", doctor.id)
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
  const actions = nextStates(state);
  const terminal = isTerminal(state);

  return (
    <main className="p-8">
      <Link href="/dashboard/appointments" className="inline-flex items-center gap-1 text-[0.875rem] text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
        <ChevronLeft size={16} /> Appointments
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">{appt.patient_name}</h1>
          <p className="tabular text-[0.9375rem] text-[var(--text-muted)]">{slotFull(appt.starts_at)} · Ref {appt.reference}</p>
        </div>
        <WorkflowBadge state={state} />
      </div>

      {ok && (
        <p className="mt-4 max-w-2xl rounded-[var(--radius-md)] bg-[var(--bg-successSubtle)] px-4 py-2.5 text-[0.875rem] text-[var(--text-success)]">
          Lifecycle updated.
        </p>
      )}
      {error && (
        <p className="mt-4 max-w-2xl rounded-[var(--radius-md)] bg-[var(--bg-dangerSubtle)] px-4 py-2.5 text-[0.875rem] text-[var(--text-danger)]">
          {error === "illegal" ? "That transition isn't allowed from the current state." : "Couldn't record that transition."}
        </p>
      )}

      <div className="mt-6 grid max-w-3xl gap-6 lg:grid-cols-2">
        {/* Next allowed actions — driven entirely by the engine */}
        <section className="ring-hairline rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-5">
          <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">Next allowed actions</p>
          <p className="mt-1 text-[0.8125rem] text-[var(--text-muted)]">{stateMeta(state).description}</p>

          {terminal ? (
            <p className="mt-4 rounded-[var(--radius-md)] bg-[var(--bg-sunken)] px-3 py-2 text-[0.875rem] text-[var(--text-muted)]">
              This appointment has reached a final state. No further transitions.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {actions.map((a) => {
                const Icon = workflowIcon(a.state);
                const tone = WORKFLOW_TONES[a.tone];
                return (
                  <form key={a.state} action={transitionAppointment}>
                    <input type="hidden" name="appointment_id" value={appt.id} />
                    <input type="hidden" name="to" value={a.state} />
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--border-control)] px-3.5 py-2.5 text-left text-[0.9375rem] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-sunken)]"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: tone.bg }}>
                        <Icon size={15} color={tone.fg} aria-hidden />
                      </span>
                      Mark as {a.label}
                    </button>
                  </form>
                );
              })}
            </div>
          )}
          <p className="mt-4 border-t border-[var(--border-subtle)] pt-3 text-[0.75rem] text-[var(--text-muted)]">
            Lifecycle is a workflow overlay. It records practice history and does not change the booking or its slot.
          </p>
        </section>

        {/* History */}
        <section>
          <p className="mb-2 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">History</p>
          <AppointmentTimeline entries={timeline} />
        </section>
      </div>
    </main>
  );
}
