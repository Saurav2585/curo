import { createClient } from "@/lib/supabase/server";

/**
 * Billing domain — reusable types, the single source of billing maths, and
 * read helpers. No payment processing: this is the shape Razorpay will later
 * write into. Every amount is computed here, never re-derived in a page.
 */

export const GST_RATE = 0.18; // India GST on SaaS (display-only here)
export const CURRENCY = "INR";

export type InvoiceStatus = "draft" | "issued" | "paid" | "void" | "overdue";
export type TransactionStatus = "pending" | "succeeded" | "failed" | "refunded" | "cancelled";
export type PaymentMethodType = "upi" | "credit_card" | "debit_card" | "net_banking";

export type Invoice = {
  id: string;
  invoice_number: string;
  customer_name: string | null;
  customer_type: "patient" | "provider" | "enterprise" | null;
  gst_number: string | null;
  billing_address: string | null;
  plan_purchased: string | null;
  coupon_code: string | null;
  currency: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  issue_date: string | null;
  due_date: string | null;
  paid_date: string | null;
  created_at: string;
};

export type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: number;
  unit_amount: number;
  amount: number;
};

// ---------------------------------------------------------------- money maths
/**
 * The one place invoice totals are computed. Given a taxable amount and an
 * optional discount, returns the full breakdown at the GST rate.
 */
export function computeInvoiceTotals(opts: {
  unitAmount: number;
  quantity?: number;
  discountAmount?: number;
  taxRate?: number;
}) {
  const quantity = opts.quantity ?? 1;
  const rate = opts.taxRate ?? GST_RATE;
  const subtotal = round(opts.unitAmount * quantity);
  const discount = round(Math.min(opts.discountAmount ?? 0, subtotal));
  const taxable = round(subtotal - discount);
  const tax = round(taxable * rate);
  const total = round(taxable + tax);
  return { subtotal, discount, taxable, tax, total };
}

const round = (n: number) => Math.round(n * 100) / 100;

/** ₹1,23,456.00 — Indian formatting, two decimals. */
export function formatMoney(amount: number, currency: string = CURRENCY): string {
  const symbol = currency === "INR" ? "₹" : "";
  return `${symbol}${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ---------------------------------------------------------------- fetchers
export async function getBillingAccount(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("billing_accounts")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function listInvoices(userId: string): Promise<Invoice[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Invoice[];
}

export async function getInvoiceWithItems(invoiceId: string) {
  const supabase = await createClient();
  const [{ data: invoice }, { data: items }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", invoiceId).maybeSingle(),
    supabase.from("invoice_line_items").select("*").eq("invoice_id", invoiceId),
  ]);
  return {
    invoice: (invoice as Invoice | null) ?? null,
    items: (items ?? []) as InvoiceLineItem[],
  };
}

export async function listPaymentMethods(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Supported methods for the placeholder UI. */
export const SUPPORTED_PAYMENT_METHODS: { type: PaymentMethodType; label: string }[] = [
  { type: "upi", label: "UPI" },
  { type: "credit_card", label: "Credit card" },
  { type: "debit_card", label: "Debit card" },
  { type: "net_banking", label: "Net banking" },
];
