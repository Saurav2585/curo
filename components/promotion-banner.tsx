import { Tag } from "lucide-react";
import { formatOffer, type Promotion } from "@/lib/promotions";

/**
 * Informative promotion banner — calm, not aggressive. No countdown timers,
 * no manufactured urgency. Reuses the existing card + token language.
 */
export function PromotionBanner({ promo }: { promo: Promotion }) {
  return (
    <div
      className="ring-hairline flex flex-col items-start gap-3 rounded-[var(--radius-lg)] p-4 sm:flex-row sm:items-center sm:justify-between"
      style={{ background: "var(--bg-brandSubtle)" }}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-surface)]">
          <Tag size={17} color="var(--text-brand)" aria-hidden />
        </span>
        <div>
          <p className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
            {promo.title}
            <span className="ml-2 rounded-[var(--radius-full)] bg-[var(--bg-surface)] px-2 py-0.5 text-[0.6875rem] font-medium text-[var(--text-brand)]">
              {formatOffer(promo)}
            </span>
          </p>
          <p className="mt-0.5 text-[0.8125rem] text-[var(--text-secondary)]">{promo.description}</p>
        </div>
      </div>

      {promo.code && (
        <span className="shrink-0 rounded-[var(--radius-md)] border border-dashed border-[var(--border-brand)] bg-[var(--bg-surface)] px-3 py-1.5 text-[0.8125rem] font-medium text-[var(--text-brand)]">
          Code: <span className="tabular font-semibold">{promo.code}</span>
        </span>
      )}
    </div>
  );
}
