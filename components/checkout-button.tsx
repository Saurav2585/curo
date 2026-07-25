"use client";

import { useState } from "react";

/**
 * Razorpay Official Checkout button. Reusable across patient and provider plan
 * cards. It asks the server to create an order, opens Razorpay Checkout, and
 * routes the outcome to the server for verification (success), or records
 * failure / cancellation. Payment truth is always established server-side; this
 * component only orchestrates the UI.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RazorpayCtor = new (options: any) => { open: () => void; on: (e: string, cb: (r: any) => void) => void };
declare global {
  interface Window { Razorpay?: RazorpayCtor }
}

function loadCheckoutScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => ({}));
}

export function CheckoutButton({
  plan,
  label,
  className,
}: {
  plan: "care_plus" | "pro" | "clinic";
  label: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const ok = await loadCheckoutScript();
      if (!ok || !window.Razorpay) throw new Error("Could not load checkout.");

      const order = await post("/api/payments/order", { plan });
      if (!order?.orderId) throw new Error(order?.error ?? "Could not start checkout.");

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Curo",
        description: order.description,
        notes: { plan },
        theme: { color: "#02707E" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async (resp: any) => {
          const v = await post("/api/payments/verify", {
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
            plan,
          });
          window.location.href = v?.ok ? "/payment/success" : "/payment/failed";
        },
        modal: {
          ondismiss: async () => {
            await post("/api/payments/cancel", { plan, razorpay_order_id: order.orderId });
            setBusy(false);
          },
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rzp.on("payment.failed", async (resp: any) => {
        await post("/api/payments/failed", {
          plan,
          razorpay_order_id: resp?.error?.metadata?.order_id,
          razorpay_payment_id: resp?.error?.metadata?.payment_id,
          reason: resp?.error?.description,
        });
        window.location.href = "/payment/failed";
      });

      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className={
          className ??
          "mt-4 h-10 w-full rounded-[var(--radius-md)] text-[0.875rem] font-medium disabled:opacity-60"
        }
        style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
      >
        {busy ? "Starting checkout…" : label}
      </button>
      {error && <p className="mt-2 text-[0.75rem] text-[var(--text-danger)]">{error}</p>}
    </div>
  );
}
