import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, MapPin, CalendarPlus, XCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { cancelBooking } from "../actions";
import { slotFull, formatFee } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Build a Google Calendar "add event" URL from the booking. */
function calendarUrl(opts: {
  title: string;
  start: string;
  end: string;
  location: string;
  details: string;
}) {
  const fmt = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d+/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${fmt(opts.start)}/${fmt(opts.end)}`,
    location: opts.location,
    details: opts.details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("appointments")
    .select(
      `id, reference, starts_at, ends_at, status, reason, patient_name,
       doctors ( full_name, slug, specialties ( name ), clinics ( name, address_line, city ) )`
    )
    .eq("id", id)
    .maybeSingle();

  if (!booking) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doctor = (booking as any).doctors;
  const clinic = doctor?.clinics;
  const cancelled = booking.status === "cancelled";

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-md px-6 py-10">
        <div
          className="rounded-[var(--radius-lg)] border p-6 text-center"
          style={
            cancelled
              ? { borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }
              : { borderColor: "var(--border-brand)", background: "var(--bg-successSubtle)" }
          }
        >
          {cancelled ? (
            <XCircle size={40} color="var(--text-muted)" className="mx-auto" aria-hidden />
          ) : (
            <CheckCircle2 size={40} color="var(--text-success)" className="mx-auto" aria-hidden />
          )}
          <h1 className="mt-3 text-[1.5rem] font-bold text-[var(--text-primary)]">
            {cancelled ? "Booking cancelled" : "You're booked"}
          </h1>
          <p className="tabular mt-1 text-[0.8125rem] text-[var(--text-muted)]">
            Reference {booking.reference}
          </p>
        </div>

        <div className="mt-6 space-y-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div>
            <p className="text-[0.75rem] uppercase tracking-wide text-[var(--text-muted)]">Doctor</p>
            <p className="font-medium text-[var(--text-primary)]">{doctor?.full_name}</p>
            <p className="text-[0.9375rem] text-[var(--text-secondary)]">
              {doctor?.specialties?.name}
            </p>
          </div>

          <div>
            <p className="text-[0.75rem] uppercase tracking-wide text-[var(--text-muted)]">When</p>
            <p className="tabular font-medium text-[var(--text-primary)]">
              {slotFull(booking.starts_at)}
            </p>
          </div>

          <div>
            <p className="text-[0.75rem] uppercase tracking-wide text-[var(--text-muted)]">Where</p>
            <p className="flex items-start gap-1.5 font-medium text-[var(--text-primary)]">
              <MapPin size={15} color="var(--text-muted)" className="mt-0.5 shrink-0" aria-hidden />
              <span>
                {clinic?.name}
                <span className="block font-normal text-[var(--text-secondary)]">
                  {clinic?.address_line}, {clinic?.city}
                </span>
              </span>
            </p>
          </div>
        </div>

        {!cancelled && (
          <>
            <a
              href={calendarUrl({
                title: `Appointment with ${doctor?.full_name}`,
                start: booking.starts_at,
                end: booking.ends_at,
                location: `${clinic?.name}, ${clinic?.address_line}, ${clinic?.city}`,
                details: `Curo booking ${booking.reference}. ${booking.reason ?? ""}`,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-control)] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-sunken)]"
            >
              <CalendarPlus size={17} aria-hidden />
              Add to calendar
            </a>

            <div className="mt-6 flex items-center justify-between text-[0.875rem]">
              <Link href="/bookings" className="font-medium text-[var(--text-brand)] hover:underline">
                All my bookings
              </Link>
              <form action={cancelBooking}>
                <input type="hidden" name="booking_id" value={booking.id} />
                <button
                  type="submit"
                  className="text-[var(--text-muted)] hover:text-[var(--text-danger)]"
                >
                  Cancel appointment
                </button>
              </form>
            </div>
          </>
        )}

        {cancelled && (
          <Link
            href="/doctors"
            className="mt-6 flex h-12 items-center justify-center rounded-[var(--radius-md)] font-medium"
            style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
          >
            Book another appointment
          </Link>
        )}
      </main>
    </>
  );
}
