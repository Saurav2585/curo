import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { StarInput } from "@/components/star-input";
import { REVIEW_DIMENSIONS } from "@/lib/reviews";
import { slotFull } from "@/lib/format";
import { submitReview } from "./actions";

export const dynamic = "force-dynamic";

export default async function WriteReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/bookings/${id}/review`);

  // Central eligibility gate: the appointment must be this patient's own,
  // completed, and not yet reviewed. Anything else bounces back to bookings.
  const { data: appt } = await supabase
    .from("appointments")
    .select("id, status, patient_id, starts_at, doctors ( full_name, specialties ( name ) )")
    .eq("id", id)
    .maybeSingle();

  if (!appt || appt.patient_id !== user.id || appt.status !== "completed") {
    redirect("/account/bookings?review=ineligible");
  }

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("appointment_id", id)
    .maybeSingle();
  if (existing) redirect("/account/bookings?review=exists");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doctor = (appt as any).doctors;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <Link
          href="/account/bookings"
          className="inline-flex items-center gap-1 text-[0.875rem] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          <ChevronLeft size={16} /> Back to bookings
        </Link>

        <div className="mt-4">
          <h1 className="t-h1">Review your visit</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            {doctor?.full_name}
            {doctor?.specialties?.name && (
              <>
                <span className="mx-1.5 text-[var(--text-disabled)]">·</span>
                {doctor.specialties.name}
              </>
            )}
          </p>
          <p className="mt-0.5 text-[0.8125rem] text-[var(--text-muted)]">
            Visited <span className="tabular">{slotFull(appt.starts_at)}</span>
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-[var(--radius-md)] bg-[var(--bg-dangerSubtle)] px-3 py-2 text-[0.875rem] text-[var(--text-danger)]">
            {error === "overall"
              ? "Please give an overall rating before submitting."
              : "Something went wrong saving your review. Please try again."}
          </p>
        )}

        <form action={submitReview} className="mt-8 space-y-8">
          <input type="hidden" name="appointment_id" value={id} />

          <section className="ring-hairline rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-6">
            <StarInput name="overall" label="Overall rating" required />
          </section>

          <section className="ring-hairline rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-6">
            <p className="mb-4 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              Rate the details <span className="font-normal normal-case">(optional)</span>
            </p>
            <div className="space-y-4">
              {REVIEW_DIMENSIONS.map((d) => (
                <StarInput key={d.key} name={d.key} label={d.label} />
              ))}
            </div>
          </section>

          <section className="ring-hairline space-y-4 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-6">
            <div>
              <label htmlFor="title" className="mb-1.5 block text-[0.875rem] font-medium text-[var(--text-secondary)]">
                Title <span className="font-normal text-[var(--text-muted)]">(optional)</span>
              </label>
              <input
                id="title"
                name="title"
                maxLength={80}
                placeholder="Sum up your visit in a few words"
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 py-2 text-[0.9375rem] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:border-[var(--border-focus)] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="comment" className="mb-1.5 block text-[0.875rem] font-medium text-[var(--text-secondary)]">
                Your review <span className="font-normal text-[var(--text-muted)]">(optional)</span>
              </label>
              <textarea
                id="comment"
                name="comment"
                rows={5}
                maxLength={2000}
                placeholder="What was your experience like? Your feedback helps other patients."
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 py-2 text-[0.9375rem] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:border-[var(--border-focus)] focus:outline-none"
              />
            </div>
          </section>

          <section className="ring-hairline space-y-3 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-6">
            <label className="flex items-start gap-3 text-[0.9375rem] text-[var(--text-secondary)]">
              <input type="checkbox" name="recommend" value="yes" defaultChecked className="mt-0.5" />
              <span>I would recommend this provider to others.</span>
            </label>
            <label className="flex items-start gap-3 text-[0.9375rem] text-[var(--text-secondary)]">
              <input type="checkbox" name="anonymous" className="mt-0.5" />
              <span>Post my review anonymously (your name won&apos;t be shown).</span>
            </label>
          </section>

          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.75rem] text-[var(--text-muted)]">
              Your visit is verified — reviews can only be left for completed appointments.
            </p>
            <button
              type="submit"
              className="shrink-0 rounded-[var(--radius-md)] px-5 py-2.5 text-[0.9375rem] font-medium"
              style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
            >
              Submit review
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
