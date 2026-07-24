import type { ReactNode } from "react";
import { AlertCircle, CreditCard, RotateCcw, Clock } from "lucide-react";
import type { Lifecycle } from "@/lib/lifecycle";
import { slotDay } from "@/lib/format";

/**
 * Reusable lifecycle notice. Renders the state-appropriate message for the
 * warning/grace/cancelled/expired states, reusing existing card + button
 * styling. Buttons ("Update payment method", "Reactivate") are intentional
 * placeholders — no payment logic exists yet.
 *
 * The calm states (trial, active) render nothing here; the plan card already
 * carries them.
 */
export function LifecycleNotice({
  lifecycle,
  audience,
}: {
  lifecycle: Lifecycle;
  audience: "patient" | "provider";
}) {
  const noun = audience === "patient" ? "membership" : "plan";
  const { state, daysRemaining, renewalDate, governingDate } = lifecycle;

  if (state === "expiring_soon") {
    return (
      <Notice tone="warn" icon={Clock}>
        Your {noun} renews in <strong>{daysRemaining} {daysRemaining === 1 ? "day" : "days"}</strong>
        {renewalDate ? <> — on <span className="tabular">{slotDay(renewalDate.toISOString())}</span></> : null}.
      </Notice>
    );
  }

  if (state === "grace_period") {
    return (
      <Notice tone="warn" icon={AlertCircle} action={{ label: "Update payment method", icon: CreditCard }}>
        We couldn&apos;t process your last payment. Your access continues for{" "}
        <strong>{daysRemaining} {daysRemaining === 1 ? "day" : "days"}</strong> while you update it.
      </Notice>
    );
  }

  if (state === "cancelled") {
    return (
      <Notice tone="neutral" icon={AlertCircle} action={{ label: "Reactivate subscription", icon: RotateCcw }}>
        Your {noun} is cancelled. You keep full access until{" "}
        <strong className="tabular">{governingDate ? slotDay(governingDate.toISOString()) : "the period ends"}</strong>.
      </Notice>
    );
  }

  if (state === "expired") {
    return (
      <Notice tone="neutral" icon={AlertCircle}>
        {audience === "patient"
          ? "Your membership has expired — you're back on the Free plan. Booking still works as normal."
          : "Your trial has ended. You still have access; upgrade any time to restore Pro features."}
      </Notice>
    );
  }

  return null;
}

function Notice({
  tone,
  icon: Icon,
  action,
  children,
}: {
  tone: "warn" | "neutral";
  icon: typeof AlertCircle;
  action?: { label: string; icon: typeof CreditCard };
  children: ReactNode;
}) {
  const style =
    tone === "warn"
      ? { borderColor: "var(--color-amber-500)", background: "var(--bg-warnSubtle)" }
      : { borderColor: "var(--border-subtle)", background: "var(--bg-surface)" };
  const iconColor = tone === "warn" ? "var(--text-warn)" : "var(--text-muted)";

  return (
    <div className="mt-4 max-w-2xl rounded-[var(--radius-lg)] border p-4" style={style}>
      <div className="flex items-start gap-3">
        <Icon size={18} color={iconColor} className="mt-0.5 shrink-0" aria-hidden />
        <div className="flex-1">
          <p className="text-[0.875rem] leading-[1.6] text-[var(--text-secondary)]">{children}</p>
          {action && (
            <button
              type="button"
              disabled
              title="Available when billing launches"
              className="mt-3 inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-control)] px-3 text-[0.8125rem] font-medium text-[var(--text-muted)]"
            >
              <action.icon size={15} aria-hidden />
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
