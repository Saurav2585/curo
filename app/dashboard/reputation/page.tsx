import { redirect } from "next/navigation";
import { Star, MessageSquare } from "lucide-react";
import { getMyDoctor } from "@/lib/doctor";
import { listPublishedReviews, computeReputation } from "@/lib/reviews";
import {
  RatingSummary,
  RatingDistribution,
  DimensionAverages,
  ReviewCard,
} from "@/components/reviews";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="ring-hairline rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-5">
      <p className="text-[0.8125rem] text-[var(--text-muted)]">{label}</p>
      <p className="tabular mt-1 text-[1.75rem] font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

export default async function ReputationPage() {
  const doctor = await getMyDoctor();
  if (!doctor) redirect("/dashboard");

  const reviews = await listPublishedReviews(doctor.id);
  const reputation = computeReputation(reviews);

  return (
    <main className="p-8">
      <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">Reputation</h1>
      <p className="text-[0.9375rem] text-[var(--text-muted)]">
        What patients say after completed visits. Separate from profile completeness — this reflects real feedback.
      </p>

      <div className="mt-6 grid max-w-4xl gap-4 sm:grid-cols-3">
        <Stat label="Overall rating" value={reputation.count ? reputation.average.toFixed(1) : "—"} />
        <Stat label="Total reviews" value={reputation.count} />
        <Stat label="Reputation score" value={reputation.count ? `${reputation.reputationScore}/100` : "—"} />
      </div>

      {reputation.count === 0 ? (
        <div className="mt-6 max-w-4xl rounded-[var(--radius-lg)] border border-dashed border-[var(--border-control)] bg-[var(--bg-surface)] p-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--bg-brandSubtle)" }}>
            <MessageSquare size={22} color="var(--text-brand)" aria-hidden />
          </span>
          <p className="mt-3 text-[1.0625rem] font-semibold text-[var(--text-primary)]">No reviews yet</p>
          <p className="mt-1 text-[0.875rem] text-[var(--text-muted)]">
            Reviews appear here once patients rate their completed visits. Verified visits only — so every review is genuine.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid max-w-4xl gap-4 lg:grid-cols-2">
          <div className="ring-hairline rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-5">
            <p className="mb-4 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">Rating breakdown</p>
            <RatingSummary reputation={reputation} />
            <div className="mt-4">
              <RatingDistribution reputation={reputation} />
            </div>
          </div>

          <div className="ring-hairline rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-5">
            <p className="mb-4 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">By category</p>
            <DimensionAverages reputation={reputation} />
            <p className="mt-4 border-t border-[var(--border-subtle)] pt-3 text-[0.875rem] text-[var(--text-secondary)]">
              <span className="tabular font-semibold text-[var(--text-primary)]">{reputation.recommendPercent}%</span> of patients would recommend you.
            </p>
          </div>
        </div>
      )}

      {reputation.count > 0 && (
        <section className="mt-8 max-w-4xl">
          <h2 className="flex items-center gap-2 text-[1.125rem] font-semibold text-[var(--text-primary)]">
            <Star size={18} color="var(--color-amber-500)" fill="var(--color-amber-500)" aria-hidden />
            Recent reviews
          </h2>
          <div className="mt-3 space-y-3">
            {reviews.slice(0, 10).map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
