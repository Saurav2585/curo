import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarX2, ChevronRight, Sparkles, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cancelBooking } from "@/app/bookings/actions";
import { slotFull } from "@/lib/format";
import { getPatientMembership } from "@/lib/subscription";
import { patientPlanName } from "@/lib/plans";

export const dynamic = "force-dynamic";

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
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] px-2 py-0.5 text-[0.6875rem] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} aria-hidden />
      {s.label}
    </span>
  );
}

/** Relative day label in the clinic's zone — "Today", "Tomorrow", etc. */
function relativeDayLabel(iso: string): string {
  const dayKey = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  const today = new Date(dayKey(new Date()) + "T00:00:00");
  const target = new Date(dayKey(new Date(iso)) + "T00:00:00");
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

export default async function AccountBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ review?: string }>;
}) {
  const { review } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in?next=/account/bookings");

  const membership = await getPatientMembership();

  const { data: rows } = await supabase
    .from("appointments")
    .select(
      `id, reference, starts_at, status,
       doctors ( full_name, slug, specialties ( name ) )`
    )
    .eq("patient_id", user.id)
    .order("starts_at", { ascending: false });

  const { data: reviewed } = await supabase
    .from("reviews")
    .select("appointment_id")
    .eq("patient_id", user.id);
  const reviewedIds = new Set((reviewed ?? []).map((r) => r.appointment_id));

  const now = Date.now();
  const bookings = rows ?? [];
  const upcoming = bookings.filter(
    (b) => b.status === "booked" && new Date(b.starts_at).getTime() >= now
  );
  const past = bookings.filter((b) => !upcoming.includes(b));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Row = ({ b, cancellable }: { b: any; cancellable: boolean }) => {
    const isCancelled = b.status === "cancelled";
    const canReview = b.status === "completed" && !reviewedIds.has(b.id);
    const hasReview = b.status === "completed" && reviewedIds.has(b.id);
    return (
      <li
        className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)] transition-shadow duration-200 hover:border-[var(--border-default)] hover:shadow-[var(--shadow-md)]"
        style={isCancelled ? { opacity: 0.6 } : undefined}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[1.0625rem] font-semibold text-[var(--text-primary)]">
              {b.doctors?.full_name}
            </p>
            <p className="mt-0.5 text-[0.9375rem] text-[var(--text-secondary)]">
              {b.doctors?.specialties?.name}
            </p>
            <p className="mt-3 text-[0.875rem] text-[var(--text-muted)]">
              <span className="font-medium text-[var(--text-secondary)]">
                {relativeDayLabel(b.starts_at)}
              </span>
              <span className="mx-1.5 text-[var(--text-disabled)]">·</span>
              <span className="tabular">{slotFull(b.starts_at)}</span>
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-3">
            <StatusBadge status={b.status} />
            {cancellable ? (
              <form action={cancelBooking}>
                <input type="hidden" name="booking_id" value={b.id} />
                <button
                  type="submit"
                  className="rounded-[var(--radius-md)] border border-[var(--border-control)] px-3.5 py-1.5 text-[0.8125rem] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-danger)] hover:text-[var(--text-danger)]"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <Link
                href={`/bookings/${b.id}`}
                aria-label="View booking"
                className="flex items-center gap-1 text-[0.8125rem] font-medium text-[var(--text-brand)] hover:underline"
              >
                View <ChevronRight size={15} />
              </Link>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3 text-[0.75rem] text-[var(--text-disabled)]">
          <span className="flex items-center gap-2">
            <span>Booking reference</span>
            <span className="tabular font-medium text-[var(--text-muted)]">{b.reference}</span>
          </span>
          {canReview && (
            <Link
              href={`/bookings/${b.id}/review`}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1.5 text-[0.8125rem] font-medium"
              style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
            >
              <Star size={14} aria-hidden /> Write a review
            </Link>
          )}
          {hasReview && (
            <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-[var(--text-muted)]">
              <Star size={14} color="var(--color-amber-500)" fill="var(--color-amber-500)" aria-hidden /> Reviewed
            </span>
          )}
        </div>
      </li>
    );
  };

  return (
    <main className="p-8">
      <h1 className="t-h1">My bookings</h1>

      {review === "thanks" && (
        <p className="mt-4 w-full rounded-[var(--radius-md)] bg-[var(--bg-successSubtle)] px-4 py-3 text-[0.875rem] text-[var(--text-success)]">
          Thanks — your review has been published. It now helps other patients choose.
        </p>
      )}
      {(review === "exists" || review === "ineligible") && (
        <p className="mt-4 w-full rounded-[var(--radius-md)] bg-[var(--bg-sunken)] px-4 py-3 text-[0.875rem] text-[var(--text-muted)]">
          {review === "exists"
            ? "You've already reviewed that visit."
            : "Reviews can only be left for completed appointments you attended."}
        </p>
      )}

      {membership?.showUpgrade && (
        <div className="mt-6 flex w-full flex-col items-start justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-brandSubtle)] p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-surface)]">
              <Sparkles size={18} color="var(--text-brand)" aria-hidden />
            </span>
            <div>
              <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">
                {patientPlanName(membership.plan)} plan ·{" "}
                {membership.overLimit ? (
                  <span>complimentary appointments used this month</span>
                ) : (
                  <>
                    <span className="tabular">{membership.remaining}</span> free appointments left this month
                  </>
                )}
              </p>
              <p className="text-[0.8125rem] text-[var(--text-muted)]">
                {membership.overLimit
                  ? "New bookings are paused until you upgrade to Care+. Your existing appointments remain available."
                  : "Upgrade to Care+ for unlimited appointments, SMS reminders and lab discounts."}
              </p>
            </div>
          </div>
          <Link
            href="/account/membership"
            className="shrink-0 rounded-[var(--radius-md)] px-4 py-2 text-[0.875rem] font-medium"
            style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
          >
            Upgrade
          </Link>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="mt-8 w-full rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "var(--bg-brandSubtle)" }}
          >
            <CalendarX2 size={26} color="var(--text-brand)" aria-hidden />
          </span>
          <p className="mt-4 text-[1.25rem] font-semibold text-[var(--text-primary)]">
            No appointments yet
          </p>
          <p className="mt-1.5 text-[var(--text-muted)]">
            Find a doctor and book your first visit.
          </p>
          <Link
            href="/doctors"
            className="mt-6 inline-flex h-11 items-center rounded-[var(--radius-md)] px-5 font-medium"
            style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
          >
            Find a doctor
          </Link>
        </div>
      ) : (
        <div className="mt-10 w-full space-y-12">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Upcoming
                <span className="tabular font-normal text-[var(--text-disabled)]">{upcoming.length}</span>
              </h2>
              <ul className="space-y-4">
                {upcoming.map((b) => (
                  <Row key={b.id} b={b} cancellable />
                ))}
              </ul>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Past &amp; cancelled
                <span className="tabular font-normal text-[var(--text-disabled)]">{past.length}</span>
              </h2>
              <ul className="space-y-4">
                {past.map((b) => (
                  <Row key={b.id} b={b} cancellable={false} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
