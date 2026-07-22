import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarX2, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { cancelBooking } from "./actions";
import { slotFull } from "@/lib/format";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in?next=/bookings");

  const { data: rows } = await supabase
    .from("appointments")
    .select(
      `id, reference, starts_at, status,
       doctors ( full_name, slug, specialties ( name ) )`
    )
    .eq("patient_id", user.id)
    .order("starts_at", { ascending: false });

  const now = Date.now();
  const bookings = rows ?? [];
  const upcoming = bookings.filter(
    (b) => b.status === "booked" && new Date(b.starts_at).getTime() >= now
  );
  const past = bookings.filter((b) => !upcoming.includes(b));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Row = ({ b, cancellable }: { b: any; cancellable: boolean }) => (
    <li className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-[var(--text-primary)]">{b.doctors?.full_name}</p>
          <StatusBadge status={b.status} />
        </div>
        <p className="text-[0.9375rem] text-[var(--text-secondary)]">
          {b.doctors?.specialties?.name}
        </p>
        <p className="tabular mt-0.5 text-[0.8125rem] text-[var(--text-muted)]">
          {slotFull(b.starts_at)}
        </p>
      </div>

      {cancellable ? (
        <form action={cancelBooking}>
          <input type="hidden" name="booking_id" value={b.id} />
          <button
            type="submit"
            className="rounded-[var(--radius-md)] border border-[var(--border-control)] px-3 py-1.5 text-[0.8125rem] text-[var(--text-secondary)] hover:text-[var(--text-danger)]"
          >
            Cancel
          </button>
        </form>
      ) : (
        <Link href={`/bookings/${b.id}`} aria-label="View booking">
          <ChevronRight size={18} color="var(--text-muted)" />
        </Link>
      )}
    </li>
  );

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-[2rem] font-bold tracking-tight text-[var(--text-primary)]">
          My bookings
        </h1>

        {bookings.length === 0 ? (
          /* Empty state — a CTA, never a dead end */
          <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center">
            <CalendarX2 size={28} color="var(--text-disabled)" className="mx-auto" aria-hidden />
            <p className="mt-3 text-[1.25rem] font-semibold text-[var(--text-primary)]">
              No appointments yet
            </p>
            <p className="mt-1 text-[var(--text-muted)]">
              Find a doctor and book your first visit.
            </p>
            <Link
              href="/doctors"
              className="mt-5 inline-flex h-11 items-center rounded-[var(--radius-md)] px-5 font-medium"
              style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
            >
              Find a doctor
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {upcoming.length > 0 && (
              <section>
                <h2 className="mb-3 text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Upcoming
                </h2>
                <ul className="space-y-3">
                  {upcoming.map((b) => (
                    <Row key={b.id} b={b} cancellable />
                  ))}
                </ul>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="mb-3 text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Past & cancelled
                </h2>
                <ul className="space-y-3">
                  {past.map((b) => (
                    <Row key={b.id} b={b} cancellable={false} />
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </main>
    </>
  );
}
