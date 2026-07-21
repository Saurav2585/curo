import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarOff, AlertCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { DateStrip } from "@/components/date-strip";
import { SlotGrid, SlotLegend } from "@/components/slot-grid";
import { getDoctorBySlug, getNextSlots } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { formatFee, slotDay, relativeDay } from "@/lib/format";
import type { Slot } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Today in the clinic's zone — not the server's. */
function todayInClinicTz(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts; // en-CA gives YYYY-MM-DD
}

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ slug }, { date }] = await Promise.all([params, searchParams]);
  const { doctor } = await getDoctorBySlug(slug);
  if (!doctor) notFound();

  const selectedDate = date ?? todayInClinicTz();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_doctor_id: doctor.id,
    p_date: selectedDate,
  });

  const slots = (data ?? []) as Slot[];
  const bookable = slots.filter((s) => s.status === "available");

  // For the empty states: where should we send them instead?
  const upcoming = slots.length === 0 || bookable.length === 0
    ? (await getNextSlots([doctor.id], 3))[doctor.id] ?? []
    : [];

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href={`/doctors/${doctor.slug}`}
          className="text-[0.9375rem] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          ← {doctor.full_name}
        </Link>

        <h1 className="mt-4 text-[2rem] font-bold tracking-tight text-[var(--text-primary)]">
          Pick a time
        </h1>
        <p className="mt-1 text-[var(--text-muted)]">
          {doctor.full_name} · {doctor.specialties?.name} ·{" "}
          <span className="tabular">{formatFee(doctor.consultation_fee)}</span>
        </p>

        <div className="mt-6">
          <DateStrip doctorSlug={doctor.slug} selectedDate={selectedDate} />
        </div>

        <div className="mt-6">
          {error ? (
            /* Error state — the date strip above stays usable */
            <div
              className="flex items-start gap-3 rounded-[var(--radius-lg)] border p-5"
              style={{
                borderColor: "var(--border-danger)",
                background: "var(--bg-dangerSubtle)",
              }}
            >
              <AlertCircle size={18} color="var(--text-danger)" aria-hidden />
              <div>
                <p className="font-medium text-[var(--text-danger)]">
                  Couldn&apos;t load times
                </p>
                <p className="mt-1 text-[0.9375rem] text-[var(--text-muted)]">
                  Pick another date above, or reload to try again.
                </p>
              </div>
            </div>
          ) : slots.length === 0 ? (
            /* Empty state — a non-working day is normal, not an error */
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center">
              <CalendarOff
                size={28}
                color="var(--text-disabled)"
                className="mx-auto"
                aria-hidden
              />
              <p className="mt-3 text-[1.25rem] font-semibold text-[var(--text-primary)]">
                {doctor.full_name} doesn&apos;t consult on this day
              </p>
              {upcoming.length > 0 && (
                <>
                  <p className="mt-1 text-[var(--text-muted)]">
                    Next available appointments:
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {upcoming.map((s) => (
                      <Link
                        key={s}
                        href={`/doctors/${doctor.slug}/book?date=${s.slice(0, 10)}`}
                        className="rounded-[var(--radius-md)] border px-4 py-2 text-[0.9375rem] font-medium"
                        style={{
                          borderColor: "var(--border-brand)",
                          color: "var(--text-brand)",
                        }}
                      >
                        {relativeDay(s)}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : bookable.length === 0 ? (
            /* Partial state — the day exists but is fully taken. Show the grid
               anyway: seeing a full day is information, not a dead end. */
            <>
              <div
                className="mb-6 rounded-[var(--radius-lg)] border p-4"
                style={{
                  borderColor: "var(--color-amber-500)",
                  background: "var(--bg-warnSubtle)",
                }}
              >
                <p className="font-medium text-[var(--text-warn)]">
                  Fully booked on {slotDay(slots[0].slot_start)}
                </p>
                {upcoming.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {upcoming.map((s) => (
                      <Link
                        key={s}
                        href={`/doctors/${doctor.slug}/book?date=${s.slice(0, 10)}`}
                        className="rounded-[var(--radius-md)] border bg-[var(--bg-surface)] px-3 py-1.5 text-[0.8125rem] font-medium"
                        style={{
                          borderColor: "var(--border-brand)",
                          color: "var(--text-brand)",
                        }}
                      >
                        {relativeDay(s)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <SlotLegend />
              <div className="mt-6">
                <SlotGrid
                  slots={slots}
                  doctorSlug={doctor.slug}
                  fee={formatFee(doctor.consultation_fee)}
                />
              </div>
            </>
          ) : (
            /* Ideal state */
            <>
              <SlotLegend />
              <div className="mt-6">
                <SlotGrid
                  slots={slots}
                  doctorSlug={doctor.slug}
                  fee={formatFee(doctor.consultation_fee)}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
