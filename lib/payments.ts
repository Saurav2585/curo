import { GST_RATE } from "@/lib/billing";

/**
 * Purchasable plans and their pricing. Server-only (imported by API routes).
 * Prices are the advertised monthly amounts in ₹ and are treated as
 * tax-inclusive, so we reverse-derive the GST breakdown from the existing
 * GST_RATE — the single billing constant. Enterprise is contact-sales only and
 * is deliberately absent here.
 */
export const PURCHASABLE_PLANS = {
  care_plus: { audience: "patient" as const,  label: "Care+",         price: 299 },
  pro:       { audience: "provider" as const, label: "Professional",  price: 899 },
  clinic:    { audience: "provider" as const, label: "Clinic Pro",    price: 2999 },
};

export type PurchasablePlanId = keyof typeof PURCHASABLE_PLANS;

export function isPurchasablePlan(id: string): id is PurchasablePlanId {
  return id === "care_plus" || id === "pro" || id === "clinic";
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * The single pricing calculation for a plan. Advertised price is the tax-
 * inclusive total; subtotal and tax are derived from GST_RATE so the invoice
 * matches what the customer is charged to the paisa.
 */
export function planPricing(id: PurchasablePlanId) {
  const meta = PURCHASABLE_PLANS[id];
  const total = meta.price;
  const subtotal = round(total / (1 + GST_RATE));
  const tax = round(total - subtotal);
  return {
    audience: meta.audience,
    label: meta.label,
    subtotal,
    tax,
    total,
    amountPaise: Math.round(total * 100), // Razorpay charges in the smallest unit
    currency: "INR" as const,
  };
}
