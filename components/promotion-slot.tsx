import { getSessionRole } from "@/lib/roles";
import { getActivePromotion, type Placement } from "@/lib/promotions";
import { PromotionBanner } from "@/components/promotion-banner";

/**
 * Drop-in promotion slot. Self-resolves the viewer's context (role → audience),
 * fetches the single highest-priority eligible promotion for this placement, and
 * renders it — or nothing. Pages never handle promotion logic themselves.
 *
 * On public/landing surfaces the audience resolves to "patient", so provider
 * pricing is never shown to the public.
 */
export async function PromotionSlot({
  placement,
  plan,
}: {
  placement: Placement;
  plan?: string | null;
}) {
  const session = await getSessionRole();
  const role = session?.role ?? "guest";
  const audience: "patient" | "provider" = role === "doctor" ? "provider" : "patient";

  const promo = await getActivePromotion({ placement, audience, role, plan: plan ?? null });
  if (!promo) return null;

  return <PromotionBanner promo={promo} />;
}
