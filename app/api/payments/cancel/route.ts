import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isPurchasablePlan, planPricing } from "@/lib/payments";

export const runtime = "nodejs";

/** Store a cancelled (dismissed) payment. No subscription change. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const plan = String(body?.plan ?? "");
  const orderId = body?.razorpay_order_id ? String(body.razorpay_order_id) : null;
  const amount = isPurchasablePlan(plan) ? planPricing(plan).total : 0;

  try {
    const service = createServiceClient();
    await service.rpc("record_cancelled_payment", {
      p_user: user.id,
      p_amount: amount,
      p_gateway_order_id: orderId,
    });
  } catch {
    /* best-effort */
  }
  return NextResponse.json({ ok: true });
}
