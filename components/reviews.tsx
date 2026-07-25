import { Star, BadgeCheck } from "lucide-react";
import type { Review, Reputation } from "@/lib/reviews";
import { slotDay } from "@/lib/format";

/** Five-star display for a 0–5 value. */
export function RatingStars({ value, size = 15 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          color="var(--color-amber-500)"
          fill={i <= Math.round(value) ? "var(--color-amber-500)" : "transparent"}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function VerifiedVisitBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-[var(--radius-full)] px-2 py-0.5 text-[0.6875rem] font-medium"
      style={{ background: "var(--bg-successSubtle)", color: "var(--text-success)" }}
    >
      <BadgeCheck size={12} aria-hidden /> Verified visit
    </span>
  );
}

/** Headline rating + count + recommend %. */
export function RatingSummary({ reputation }: { reputation: Reputation }) {
  return (
    <div className="flex items-center gap-4">
      <div>
        <p className="tabular text-[2.25rem] font-bold leading-none text-[var(--text-primary)]">
          {reputation.count ? reputation.average.toFixed(1) : "—"}
        </p>
        <div className="mt-1"><RatingStars value={reputation.average} /></div>
      </div>
      <div className="text-[0.8125rem] text-[var(--text-muted)]">
        <p><span className="tabular font-medium text-[var(--text-secondary)]">{reputation.count}</span> reviews</p>
        {reputation.count > 0 && (
          <p><span className="tabular font-medium text-[var(--text-secondary)]">{reputation.recommendPercent}%</span> would recommend</p>
        )}
      </div>
    </div>
  );
}

/** 5→1 distribution bars. */
export function RatingDistribution({ reputation }: { reputation: Reputation }) {
  const total = reputation.count || 1;
  return (
    <div className="space-y-1.5">
      {([5, 4, 3, 2, 1] as const).map((star) => {
        const c = reputation.distribution[star];
        return (
          <div key={star} className="flex items-center gap-2 text-[0.8125rem]">
            <span className="tabular w-3 text-[var(--text-muted)]">{star}</span>
            <Star size={12} color="var(--color-amber-500)" fill="var(--color-amber-500)" aria-hidden />
            <span className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "var(--bg-sunken)" }}>
              <span className="block h-full rounded-full" style={{ width: `${(c / total) * 100}%`, background: "var(--color-amber-500)" }} />
            </span>
            <span className="tabular w-6 text-right text-[var(--text-muted)]">{c}</span>
          </div>
        );
      })}
    </div>
  );
}

/** A single review. */
export function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="ring-hairline rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <RatingStars value={review.overall} size={14} />
          {review.verified_visit && <VerifiedVisitBadge />}
        </div>
        <span className="tabular text-[0.75rem] text-[var(--text-muted)]">{slotDay(review.created_at)}</span>
      </div>
      {review.title && <p className="mt-2 font-medium text-[var(--text-primary)]">{review.title}</p>}
      {review.comment && <p className="mt-1 text-[0.9375rem] leading-[1.6] text-[var(--text-secondary)]">{review.comment}</p>}
      <p className="mt-3 text-[0.8125rem] text-[var(--text-muted)]">
        — {review.anonymous ? "Anonymous patient" : review.reviewer_name || "Patient"}
      </p>
    </article>
  );
}

/** Per-dimension averages. */
export function DimensionAverages({ reputation }: { reputation: Reputation }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {reputation.dimensions.map((d) => (
        <li key={d.key} className="flex items-center justify-between text-[0.875rem]">
          <span className="text-[var(--text-secondary)]">{d.label}</span>
          <span className="flex items-center gap-1.5">
            <RatingStars value={d.average} size={12} />
            <span className="tabular text-[0.8125rem] text-[var(--text-muted)]">{d.average || "—"}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
