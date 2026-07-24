import { createClient } from "@/lib/supabase/server";
import { InvoiceStatusBadge } from "@/components/invoice-status";
import { formatMoney, type Invoice } from "@/lib/billing";
import { slotDay } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  const supabase = await createClient();
  const [{ data: invoices }, { data: transactions }] = await Promise.all([
    supabase.from("invoices").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(200),
  ]);

  return (
    <main className="p-8">
      <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">Billing</h1>
      <p className="text-[0.9375rem] text-[var(--text-muted)]">Invoices, transactions and payment status.</p>

      <section className="mt-6">
        <h2 className="mb-3 text-[1.125rem] font-semibold text-[var(--text-primary)]">Invoices</h2>
        {invoices && invoices.length > 0 ? (
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
            <table className="w-full text-[0.875rem]">
              <thead>
                <tr className="bg-[var(--bg-sunken)] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  <th className="px-4 py-2.5 font-medium">Invoice</th>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(invoices as Invoice[]).map((inv) => (
                  <tr key={inv.id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                    <td className="tabular px-4 py-3 font-medium text-[var(--text-primary)]">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{inv.customer_name ?? "—"}</td>
                    <td className="tabular px-4 py-3 text-[var(--text-muted)]">{inv.issue_date ? slotDay(new Date(inv.issue_date).toISOString()) : "—"}</td>
                    <td className="tabular px-4 py-3 text-right text-[var(--text-primary)]">{formatMoney(inv.total_amount, inv.currency)}</td>
                    <td className="px-4 py-3"><InvoiceStatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center text-[var(--text-muted)]">
            No invoices yet — billing runs in a later phase.
          </p>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-[1.125rem] font-semibold text-[var(--text-primary)]">Transactions</h2>
          <button type="button" disabled title="Available when billing launches" className="cursor-not-allowed rounded-[var(--radius-md)] border border-[var(--border-control)] px-3 py-1.5 text-[0.8125rem] font-medium text-[var(--text-muted)]">
            Issue refund
          </button>
        </div>
        <p className="mt-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center text-[var(--text-muted)]">
          {transactions && transactions.length > 0
            ? `${transactions.length} transactions`
            : "No transactions yet. Refunds and payment status will appear here once the gateway is connected."}
        </p>
      </section>
    </main>
  );
}
