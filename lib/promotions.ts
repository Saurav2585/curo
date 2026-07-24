import { createClient } from "@/lib/supabase/server";

/**
 * Promotion & coupon engine. Centralises all eligibility and priority logic so
 * a new campaign is a new database row, never new code. Display + validation
 * only — nothing here redeems a coupon or touches money.
 */

export type PromoType =
  | "welcome"
  | "referral"
  | "festival"
  | "limited_time"
  | "membership_upgrade"
  | "provider_subscription"
  | (string & {}); // open for future types without a code change

export type CouponType =
  | "percentage"
  | "fixed"
  | "trial_extension"
  | "extra_appointments"
  | "lab_discount"
  | "provider_discount";

export type PromoAudience = "patient" | "provider" | "both";
export type Placement = "landing" | "membership" | "billing" | "upgrade" | "trial";

export type Promotion = {
  id: string;
  code: string | null;
  title: string;
  description: string;
  promo_type: PromoType;
  coupon_type: CouponType;
  value: number;
  audience: PromoAudience;
  placements: string[];
  valid_from: string | null;
  valid_until: string | null;
  max_uses: number | null;
  per_user_limit: number | null;
  uses_count: number;
  eligible_plans: string[];
  eligible_roles: string[];
  eligible_products: string[];
  active: boolean;
  priority: number;
};

export type PromoContext = {
  placement: Placement;
  audience: "patient" | "provider";
  role: string;      // 'guest' | 'patient' | 'doctor' | 'admin'
  plan?: string | null;
};

// ---------------------------------------------------------------- pure logic
/** Is a promotion eligible to show in this context right now? */
export function isEligible(p: Promotion, ctx: PromoContext, now: Date = new Date()): boolean {
  if (!p.active) return false;
  if (p.valid_from && now < new Date(p.valid_from)) return false;
  if (p.valid_until && now > new Date(p.valid_until)) return false;
  if (p.max_uses != null && p.uses_count >= p.max_uses) return false;
  if (!p.placements.includes(ctx.placement)) return false;
  if (p.audience !== "both" && p.audience !== ctx.audience) return false;
  if (p.eligible_roles.length > 0 && !p.eligible_roles.includes(ctx.role)) return false;
  if (p.eligible_plans.length > 0 && (!ctx.plan || !p.eligible_plans.includes(ctx.plan))) return false;
  return true;
}

/** Highest-priority eligible promotion, or null. Prevents banner stacking. */
export function selectPromotion(promos: Promotion[], ctx: PromoContext, now: Date = new Date()): Promotion | null {
  const eligible = promos.filter((p) => isEligible(p, ctx, now));
  if (eligible.length === 0) return null;
  return eligible.sort((a, b) => b.priority - a.priority)[0];
}

/** Human-readable offer, derived from coupon type + value. */
export function formatOffer(p: Promotion): string {
  switch (p.coupon_type) {
    case "percentage": return `${p.value}% off`;
    case "fixed": return `₹${p.value} off`;
    case "trial_extension": return `${p.value} extra trial days`;
    case "extra_appointments": return `${p.value} extra appointments`;
    case "lab_discount": return `${p.value}% lab discount`;
    case "provider_discount": return `${p.value}% off your subscription`;
    default: return "Special offer";
  }
}

// ---------------------------------------------------------------- fetch (server)
/** Fetch active promotions for a placement, then pick the highest-priority
 *  eligible one. Server-only (uses the server Supabase client). */
export async function getActivePromotion(ctx: PromoContext): Promise<Promotion | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("promotions")
    .select("*")
    .eq("active", true)
    .contains("placements", [ctx.placement])
    .in("audience", [ctx.audience, "both"]);

  return selectPromotion((data ?? []) as Promotion[], ctx);
}
