import { Check } from "lucide-react";
import type { Plan } from "@/lib/plans";

/**
 * Reuses the pricing-card visual language for in-app plan comparison. In this
 * foundation phase there is no checkout, so the CTA is a clear, honest
 * "Coming soon" — the layout is ready for billing to slot in later.
 */
export function PlanComparison({
  plans,
  currentPlanId,
}: {
  plans: Plan[];
  currentPlanId?: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlanId;
        return (
          <div
            key={plan.id}
            className="relative flex flex-col rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-5"
            style={{
              borderColor: plan.highlighted ? "var(--border-brand)" : "var(--border-subtle)",
              boxShadow: plan.highlighted ? "var(--shadow-md)" : "var(--shadow-sm)",
            }}
          >
            {plan.highlighted && !isCurrent && (
              <span
                className="absolute -top-2.5 left-5 rounded-[var(--radius-full)] px-2.5 py-0.5 text-[0.6875rem] font-semibold"
                style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
              >
                Popular
              </span>
            )}
            {isCurrent && (
              <span
                className="absolute -top-2.5 left-5 rounded-[var(--radius-full)] px-2.5 py-0.5 text-[0.6875rem] font-semibold"
                style={{ background: "var(--bg-successSubtle)", color: "var(--text-success)" }}
              >
                Your plan
              </span>
            )}

            <h3 className="text-[1.125rem] font-semibold text-[var(--text-primary)]">{plan.name}</h3>
            <p className="mt-0.5 min-h-[2.25rem] text-[0.8125rem] text-[var(--text-muted)]">{plan.tagline}</p>
            <p className="mt-2">
              <span className="tabular text-[1.75rem] font-bold text-[var(--text-primary)]">{plan.price}</span>{" "}
              <span className="text-[0.8125rem] text-[var(--text-muted)]">{plan.cycle}</span>
            </p>

            <button
              type="button"
              disabled
              className="mt-4 h-10 w-full cursor-not-allowed rounded-[var(--radius-md)] border border-[var(--border-control)] text-[0.875rem] font-medium text-[var(--text-muted)]"
              title="Billing launches soon"
            >
              {isCurrent ? "Current plan" : "Coming soon"}
            </button>

            <ul className="mt-5 space-y-2.5">
              {plan.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-[0.875rem]">
                  <Check size={16} color="var(--text-success)" className="mt-0.5 shrink-0" aria-hidden />
                  <span className="text-[var(--text-secondary)]">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
