import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isPurchasablePlan, planPricing } from "@/lib/payments";
import { verifyWebhookSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

/**
 * Razorpay webhook. Verifies the payload signature, then reconciles payments
 * idempotently — a safety net independent of the browser round-trip. Handles
 * payment.captured and payment.failed now, and acknowledges subscription.charged
 * for future compatibility. Always 200 on a verified payload so Razorpay does
 * not retry; only a bad signature is rejected.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: {
    event?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: { payment?: { entity?: any } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload." }, { status: 400 });
  }

  const type = event.event ?? "";
  const payment = event.payload?.payment?.entity;

  try {
    const service = createServiceClient();

    if (type === "payment.captured" && payment) {
      const notes = payment.notes ?? {};
      const plan = String(notes.plan ?? "");
      const userId = String(notes.user_id ?? "");
      // Only act when we can attribute the payment; otherwise acknowledge safely.
      if (userId && isPurchasablePlan(plan)) {
        const pricing = planPricing(plan);
        await service.rpc("apply_successful_payment", {
          p_user: userId,
          p_audience: pricing.audience,
          p_plan: plan,
          p_plan_label: pricing.label,
          p_subtotal: pricing.subtotal,
          p_tax: pricing.tax,
          p_total: pricing.total,
          p_gateway_order_id: String(payment.order_id ?? ""),
          p_gateway_payment_id: String(payment.id ?? ""),
          p_method: payment.method ? String(payment.method) : null,
        });
      }
    } else if (type === "payment.failed" && payment) {
      const userId = String(payment.notes?.user_id ?? "");
      if (userId) {
        await service.rpc("record_failed_payment", {
          p_user: userId,
          p_amount: payment.amount ? Number(payment.amount) / 100 : 0,
          p_gateway_order_id: String(payment.order_id ?? ""),
          p_gateway_payment_id: String(payment.id ?? ""),
          p_reason: payment.error_description ? String(payment.error_description) : null,
        });
      }
    }
    // subscription.charged and any other events: acknowledged for future use.
  } catch {
    // Swallow to avoid retry storms; the synchronous verify route is the primary
    // path and this reconciliation is idempotent.
  }

  return NextResponse.json({ received: true });
}
