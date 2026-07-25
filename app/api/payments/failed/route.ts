import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isPurchasablePlan, planPricing } from "@/lib/payments";

export const runtime = "nodejs";

/** Store a failed payment. The subscription is left unchanged. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const plan = String(body?.plan ?? "");
  const orderId = body?.razorpay_order_id ? String(body.razorpay_order_id) : null;
  const paymentId = body?.razorpay_payment_id ? String(body.razorpay_payment_id) : null;
  const reason = body?.reason ? String(body.reason) : null;
  const amount = isPurchasablePlan(plan) ? planPricing(plan).total : 0;

  try {
    const service = createServiceClient();
    await service.rpc("record_failed_payment", {
      p_user: user.id,
      p_amount: amount,
      p_gateway_order_id: orderId,
      p_gateway_payment_id: paymentId,
      p_reason: reason,
    });
  } catch {
    /* best-effort logging; never blocks the UX */
  }
  return NextResponse.json({ ok: true });
}
