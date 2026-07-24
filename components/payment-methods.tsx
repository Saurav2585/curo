import { Smartphone, CreditCard, Landmark } from "lucide-react";
import { SUPPORTED_PAYMENT_METHODS, type PaymentMethodType } from "@/lib/billing";

const ICON: Record<PaymentMethodType, typeof CreditCard> = {
  upi: Smartphone,
  credit_card: CreditCard,
  debit_card: CreditCard,
  net_banking: Landmark,
};

/**
 * Payment-method placeholder. Shows the methods that will be available when
 * billing launches. No gateway, no tokens — the "Add" action is disabled.
 */
export function PaymentMethodsPlaceholder() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
      <p className="font-medium text-[var(--text-primary)]">Payment methods</p>
      <p className="mt-1 text-[0.8125rem] text-[var(--text-muted)]">
        Add a payment method when billing goes live. We&apos;ll support:
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {SUPPORTED_PAYMENT_METHODS.map(({ type, label }) => {
          const Icon = ICON[type];
          return (
            <li
              key={type}
              className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-3 py-2 text-[0.875rem] text-[var(--text-secondary)]"
            >
              <Icon size={16} color="var(--text-muted)" aria-hidden />
              {label}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        disabled
        title="Available when billing launches"
        className="mt-4 h-9 cursor-not-allowed rounded-[var(--radius-md)] border border-[var(--border-control)] px-3 text-[0.8125rem] font-medium text-[var(--text-muted)]"
      >
        Add payment method
      </button>
    </div>
  );
}
