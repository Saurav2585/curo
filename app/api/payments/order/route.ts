import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPurchasablePlan, planPricing } from "@/lib/payments";
import { createRazorpayOrder, publicKeyId, razorpayConfigured } from "@/lib/razorpay";

export const runtime = "nodejs";

/**
 * Create a Razorpay order for a purchasable plan. Amount and audience are
 * computed server-side from the plan id — the client's only input is which plan
 * it wants. Enterprise is not purchasable here.
 */
export async function POST(req: Request) {
  if (!razorpayConfigured()) {
    return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const plan = String(body?.plan ?? "");
  if (!isPurchasablePlan(plan)) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }

  const pricing = planPricing(plan);

  // Authorisation: provider plans require a doctor profile; Care+ is for patients.
  if (pricing.audience === "provider") {
    const { data: doctor } = await supabase
      .from("doctors").select("id").eq("profile_id", user.id).maybeSingle();
    if (!doctor) return NextResponse.json({ error: "A provider account is required." }, { status: 403 });
  }

  try {
    const order = await createRazorpayOrder({
      amountPaise: pricing.amountPaise,
      receipt: `curo_${plan}_${Date.now()}`,
      notes: { user_id: user.id, plan, audience: pricing.audience },
    });
    return NextResponse.json({
      orderId: order.id,
      amount: pricing.amountPaise,
      currency: pricing.currency,
      keyId: publicKeyId(),
      planLabel: pricing.label,
      description: `${pricing.label} — monthly subscription`,
    });
  } catch {
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 502 });
  }
}
