import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isPurchasablePlan, planPricing } from "@/lib/payments";
import { verifyPaymentSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

/**
 * Verify a completed checkout and activate the subscription. Success is proven
 * ONLY by the server-side signature check — the client's reported status is
 * never trusted. Amounts are recomputed server-side from the plan. Activation is
 * atomic and idempotent (apply_successful_payment), invoked with the service
 * role after verification.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const orderId = String(body?.razorpay_order_id ?? "");
  const paymentId = String(body?.razorpay_payment_id ?? "");
  const signature = String(body?.razorpay_signature ?? "");
  const plan = String(body?.plan ?? "");

  if (!orderId || !paymentId || !signature || !isPurchasablePlan(plan)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // The only trusted signal of success.
  if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  const pricing = planPricing(plan); // server-computed, never from the client

  try {
    const service = createServiceClient();
    const { data, error } = await service.rpc("apply_successful_payment", {
      p_user: user.id,
      p_audience: pricing.audience,
      p_plan: plan,
      p_plan_label: pricing.label,
      p_subtotal: pricing.subtotal,
      p_tax: pricing.tax,
      p_total: pricing.total,
      p_gateway_order_id: orderId,
      p_gateway_payment_id: paymentId,
      p_method: null,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, invoiceId: data });
  } catch {
    return NextResponse.json({ error: "Activation failed." }, { status: 500 });
  }
}
