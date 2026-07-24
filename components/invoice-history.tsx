import Link from "next/link";
import { FileText } from "lucide-react";
import { InvoiceStatusBadge } from "@/components/invoice-status";
import { formatMoney, type Invoice } from "@/lib/billing";
import { slotDay } from "@/lib/format";

/**
 * Reusable invoice history table with a proper empty state. Rows link to the
 * shared invoice detail view. Used on both the patient and provider billing
 * surfaces.
 */
export function InvoiceHistory({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "var(--bg-sunken)" }}>
          <FileText size={20} color="var(--text-muted)" aria-hidden />
        </span>
        <p className="mt-3 font-medium text-[var(--text-primary)]">No invoices yet</p>
        <p className="mt-1 text-[0.875rem] text-[var(--text-muted)]">
          Your invoices will appear here once billing is active.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
      <table className="w-full text-[0.9375rem]">
        <thead>
          <tr className="bg-[var(--bg-sunken)] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[var(--text-muted)]">
            <th className="px-4 py-2.5 font-medium">Invoice</th>
            <th className="px-4 py-2.5 font-medium">Date</th>
            <th className="px-4 py-2.5 font-medium">Plan</th>
            <th className="px-4 py-2.5 text-right font-medium">Total</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              <td className="tabular px-4 py-3 font-medium text-[var(--text-primary)]">{inv.invoice_number}</td>
              <td className="tabular px-4 py-3 text-[var(--text-muted)]">
                {inv.issue_date ? slotDay(new Date(inv.issue_date).toISOString()) : "—"}
              </td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">{inv.plan_purchased ?? "—"}</td>
              <td className="tabular px-4 py-3 text-right font-medium text-[var(--text-primary)]">
                {formatMoney(inv.total_amount, inv.currency)}
              </td>
              <td className="px-4 py-3"><InvoiceStatusBadge status={inv.status} /></td>
              <td className="px-4 py-3 text-right">
                <Link href={`/invoices/${inv.id}`} className="text-[0.8125rem] font-medium text-[var(--text-brand)] hover:underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
