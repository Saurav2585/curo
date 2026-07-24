/**
 * Search-ranking foundation. A single, CONFIGURABLE scoring function so ranking
 * logic lives in one place — never hardcoded across pages. Public search does
 * not consume this yet (ordering is unchanged); it is ready for when it does.
 *
 * Future paid visibility only changes `visibilityLevel` / `sponsoredWeight` on
 * the provider; the algorithm here stays the same.
 */

export type VisibilityLevel = "standard" | "featured" | "sponsored";
export type SubscriptionTier = "trial" | "free" | "pro" | "clinic" | "enterprise";

export type RankingFactors = {
  visibilityLevel: VisibilityLevel;
  verified: boolean;
  rating: number;        // 0–5
  reviewCount: number;   // absolute
  completeness: number;  // 0–100
  subscriptionTier: SubscriptionTier;
  sponsoredWeight: number;
};

/** Every knob in one object — tune ranking without touching the algorithm. */
export type RankingConfig = {
  visibility: Record<VisibilityLevel, number>;
  verifiedBonus: number;
  ratingWeight: number;      // applied to rating/5
  reviewWeight: number;      // applied to min(reviewCount/reviewSaturation, 1)
  reviewSaturation: number;
  completenessWeight: number; // applied to completeness/100
  tier: Record<SubscriptionTier, number>;
};

export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  visibility: { standard: 0, featured: 15, sponsored: 30 },
  verifiedBonus: 10,
  ratingWeight: 20,
  reviewWeight: 10,
  reviewSaturation: 100,
  completenessWeight: 15,
  tier: { trial: 0, free: 0, pro: 5, clinic: 8, enterprise: 10 },
};

export type RankingContribution = { label: string; points: number };

/** The per-factor breakdown, for transparent display. */
export function rankingBreakdown(
  f: RankingFactors,
  config: RankingConfig = DEFAULT_RANKING_CONFIG
): RankingContribution[] {
  const round = (n: number) => Math.round(n * 10) / 10;
  return [
    { label: "Visibility level", points: round(config.visibility[f.visibilityLevel]) },
    { label: "Verified provider", points: f.verified ? config.verifiedBonus : 0 },
    { label: "Rating", points: round((Math.max(0, Math.min(5, f.rating)) / 5) * config.ratingWeight) },
    { label: "Reviews", points: round(Math.min(f.reviewCount / config.reviewSaturation, 1) * config.reviewWeight) },
    { label: "Profile completeness", points: round((f.completeness / 100) * config.completenessWeight) },
    { label: "Subscription tier", points: round(config.tier[f.subscriptionTier]) },
    { label: "Sponsored weight", points: round(f.sponsoredWeight) },
  ];
}

/** The single ranking score. Higher ranks higher (when search adopts it). */
export function computeRankingScore(
  f: RankingFactors,
  config: RankingConfig = DEFAULT_RANKING_CONFIG
): number {
  const total = rankingBreakdown(f, config).reduce((sum, c) => sum + c.points, 0);
  return Math.round(total * 10) / 10;
}
