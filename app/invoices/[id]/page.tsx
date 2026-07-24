import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Download, CalendarCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getInvoiceWithItems, formatMoney } from "@/lib/billing";
import { InvoiceStatusBadge } from "@/components/invoice-status";
import { slotDay } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/invoices/${id}`);

  // RLS ensures a user can only read their own invoice; a foreign id returns null.
  const { invoice, items } = await getInvoiceWithItems(id);
  if (!invoice) notFound();

  const date = (d: string | null) => (d ? slotDay(new Date(d).toISOString()) : "—");

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/account/billing" className="t-small font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]">
        ← Back to billing
      </Link>

      <div className="mt-4 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)]" style={{ background: "var(--bg-brand)" }}>
              <CalendarCheck size={18} color="var(--text-onBrand)" aria-hidden />
            </span>
            <span className="text-[1.25rem] font-semibold text-[var(--text-primary)]">Curo</span>
          </div>
          <div className="text-right">
            <p className="tabular text-[0.9375rem] font-semibold text-[var(--text-primary)]">{invoice.invoice_number}</p>
            <div className="mt-1"><InvoiceStatusBadge status={invoice.status} /></div>
          </div>
        </div>

        {/* Meta */}
        <div className="grid gap-6 border-b border-[var(--border-subtle)] p-6 sm:grid-cols-2">
          <div>
            <p className="t-micro uppercase tracking-wide">Billed to</p>
            <p className="mt-1 font-medium text-[var(--text-primary)]">{invoice.customer_name ?? "—"}</p>
            {invoice.billing_address && <p className="t-small mt-0.5 whitespace-pre-line">{invoice.billing_address}</p>}
            {invoice.gst_number && <p className="t-small mt-0.5">GST: <span className="tabular">{invoice.gst_number}</span></p>}
          </div>
          <div className="sm:text-right">
            <p className="t-small">Issue date: <span className="tabular text-[var(--text-secondary)]">{date(invoice.issue_date)}</span></p>
            <p className="t-small">Due date: <span className="tabular text-[var(--text-secondary)]">{date(invoice.due_date)}</span></p>
            {invoice.paid_date && <p className="t-small">Paid: <span className="tabular text-[var(--text-secondary)]">{date(invoice.paid_date)}</span></p>}
          </div>
        </div>

        {/* Line items */}
        <div className="p-6">
          <table className="w-full text-[0.875rem]">
            <thead>
              <tr className="text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[var(--text-muted)]">
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 text-center font-medium">Qty</th>
                <th className="pb-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((it) => (
                  <tr key={it.id} className="border-t border-[var(--border-subtle)]">
                    <td className="py-2.5 text-[var(--text-primary)]">{it.description}</td>
                    <td className="tabular py-2.5 text-center text-[var(--text-muted)]">{it.quantity}</td>
                    <td className="tabular py-2.5 text-right text-[var(--text-primary)]">{formatMoney(it.amount, invoice.currency)}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-[var(--border-subtle)]">
                  <td className="py-2.5 text-[var(--text-primary)]">{invoice.plan_purchased ?? "Subscription"}</td>
                  <td className="tabular py-2.5 text-center text-[var(--text-muted)]">1</td>
                  <td className="tabular py-2.5 text-right text-[var(--text-primary)]">{formatMoney(invoice.subtotal, invoice.currency)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 ml-auto max-w-xs space-y-1.5 border-t border-[var(--border-subtle)] pt-4 text-[0.875rem]">
            <Row label="Subtotal" value={formatMoney(invoice.subtotal, invoice.currency)} />
            {invoice.discount_amount > 0 && (
              <Row
                label={`Discount${invoice.coupon_code ? ` (${invoice.coupon_code})` : ""}`}
                value={`− ${formatMoney(invoice.discount_amount, invoice.currency)}`}
              />
            )}
            <Row label="GST (18%)" value={formatMoney(invoice.tax_amount, invoice.currency)} />
            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-1.5">
              <span className="font-semibold text-[var(--text-primary)]">Total</span>
              <span className="tabular font-semibold text-[var(--text-primary)]">{formatMoney(invoice.total_amount, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] p-6">
          <p className="t-small">Payments are handled securely at checkout — coming soon.</p>
          <button
            type="button"
            disabled
            title="Available when billing launches"
            className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-control)] px-3 text-[0.8125rem] font-medium text-[var(--text-muted)]"
          >
            <Download size={15} aria-hidden /> Download PDF
          </button>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="tabular text-[var(--text-secondary)]">{value}</span>
    </div>
  );
}
