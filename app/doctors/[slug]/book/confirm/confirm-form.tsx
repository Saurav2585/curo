"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, Clock } from "lucide-react";
import { confirmBooking, type BookingState } from "./actions";
import { slotTime, relativeDay } from "@/lib/format";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 w-full rounded-[var(--radius-md)] font-medium disabled:opacity-60"
      style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
    >
      {pending ? "Confirming…" : "Confirm booking"}
    </button>
  );
}

export function ConfirmForm({
  doctor,
  slotStart,
  slotEnd,
  defaultName,
  defaultPhone,
}: {
  doctor: { id: string; slug: string };
  slotStart: string;
  slotEnd: string;
  defaultName: string;
  defaultPhone: string;
}) {
  const [state, formAction] = useActionState<BookingState, FormData>(
    confirmBooking,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="doctor_id" value={doctor.id} />
      <input type="hidden" name="doctor_slug" value={doctor.slug} />
      <input type="hidden" name="slot_start" value={slotStart} />
      <input type="hidden" name="slot_end" value={slotEnd} />

      {/* Slot-taken race: the most important error in the app. Preserve the
          form, explain plainly, and offer the nearest times as one-tap links. */}
      {state?.status === "slot_taken" && (
        <div
          className="rounded-[var(--radius-lg)] border p-4"
          style={{ borderColor: "var(--color-amber-500)", background: "var(--bg-warnSubtle)" }}
        >
          <p className="flex items-center gap-2 font-medium text-[var(--text-warn)]">
            <Clock size={16} aria-hidden />
            {state.message}
          </p>
          {state.alternatives.length > 0 && (
            <>
              <p className="mt-2 text-[0.8125rem] text-[var(--text-secondary)]">
                Nearest available times:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {state.alternatives.map((slot) => (
                  <Link
                    key={slot}
                    href={`/doctors/${doctor.slug}/book/confirm?slot=${encodeURIComponent(slot)}`}
                    className="rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-3 py-1.5 text-[0.8125rem] font-medium"
                    style={{ borderColor: "var(--border-brand)", color: "var(--text-brand)" }}
                  >
                    {relativeDay(slot)}, {slotTime(slot)}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {state?.status === "error" && (
        <div
          className="flex items-start gap-2 rounded-[var(--radius-md)] border p-3 text-[0.8125rem]"
          style={{ borderColor: "var(--border-danger)", background: "var(--bg-dangerSubtle)" }}
        >
          <AlertCircle size={16} color="var(--text-danger)" className="mt-0.5 shrink-0" aria-hidden />
          <span className="text-[var(--text-danger)]">{state.message}</span>
        </div>
      )}

      <div>
        <label htmlFor="patient_name" className="text-[0.8125rem] font-medium text-[var(--text-secondary)]">
          Patient name
        </label>
        <input
          id="patient_name"
          name="patient_name"
          defaultValue={defaultName}
          autoComplete="name"
          className="mt-1 h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="patient_phone" className="text-[0.8125rem] font-medium text-[var(--text-secondary)]">
          Phone number
        </label>
        <input
          id="patient_phone"
          name="patient_phone"
          type="tel"
          defaultValue={defaultPhone}
          autoComplete="tel"
          placeholder="+91 98765 43210"
          className="mt-1 h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="reason" className="text-[0.8125rem] font-medium text-[var(--text-secondary)]">
          Reason for visit <span className="font-normal text-[var(--text-muted)]">(optional)</span>
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          placeholder="e.g. Follow-up on blood pressure"
          className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 py-2 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
