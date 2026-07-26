import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Sparkles, ArrowUpCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { PlanComparison } from "@/components/plan-comparison";
import { PlanBadge } from "@/components/plan-badge";
import { LifecycleNotice } from "@/components/lifecycle-notice";
import { PromotionSlot } from "@/components/promotion-slot";
import { getPatientMembership } from "@/lib/subscription";
import { PATIENT_PLANS, patientPlanName } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function MembershipPage() {
  const membership = await getPatientMembership();
  if (!membership) redirect("/sign-in?next=/account/membership");

  const current = PATIENT_PLANS.find((p) => p.id === membership.plan) ?? PATIENT_PLANS[0];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="t-eyebrow">Account</p>
        <h1 className="t-h1 mt-2">Membership</h1>

        {/* Promotion slot — membership placement */}
        <div className="mt-6">
          <PromotionSlot placement="membership" plan={membership.plan} />
        </div>

        {/* Current plan + usage */}
        <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.8125rem] text-[var(--text-muted)]">Current plan</p>
              <p className="mt-0.5 flex items-center gap-2 text-[1.375rem] font-semibold text-[var(--text-primary)]">
                {patientPlanName(membership.plan)}
                <PlanBadge plan={membership.plan} />
                {membership.plan !== "free" && <Sparkles size={18} color="var(--text-brand)" aria-hidden />}
              </p>
            </div>
            {membership.showUpgrade && (
              <a
                href="#plans"
                className="shrink-0 rounded-[var(--radius-md)] px-4 py-2 text-[0.875rem] font-medium"
                style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
              >
                Upgrade
              </a>
            )}
          </div>

          {/* Appointments used / remaining — display only, free tier */}
          {membership.isFree && (
            <div className="mt-5 border-t border-[var(--border-subtle)] pt-4">
              <div className="flex items-center justify-between text-[0.875rem]">
                <span className="text-[var(--text-muted)]">Appointments this month</span>
                <span className="tabular font-medium text-[var(--text-primary)]">
                  {membership.used} of {membership.quota} used
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: "var(--bg-sunken)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (membership.used / membership.quota) * 100)}%`,
                    background: "var(--bg-brand)",
                  }}
                />
              </div>
              <p className="mt-1.5 text-[0.8125rem] text-[var(--text-muted)]">
                <span className="tabular font-medium text-[var(--text-secondary)]">{membership.remaining}</span> free
                appointments remaining this month.
              </p>

              {/* Over the complimentary limit → recommend, never block */}
              {membership.overLimit && (
                <div
                  className="mt-3 flex items-start gap-2 rounded-[var(--radius-md)] border p-3 text-[0.8125rem]"
                  style={{ borderColor: "var(--border-brand)", background: "var(--bg-surface)" }}
                >
                  <ArrowUpCircle size={16} color="var(--text-brand)" className="mt-0.5 shrink-0" aria-hidden />
                  <span className="text-[var(--text-secondary)]">
                    You&apos;ve used all your complimentary appointments this month, so new bookings are
                    paused. Upgrade to <strong className="text-[var(--text-primary)]">Care+</strong> for
                    unlimited appointments, faster booking and lab discounts — your existing appointments
                    stay available.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Plan benefits */}
          <div className="mt-5 border-t border-[var(--border-subtle)] pt-4">
            <p className="text-[0.8125rem] font-medium text-[var(--text-secondary)]">Your benefits</p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {current.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-[0.875rem]">
                  <Check size={15} color="var(--text-success)" className="mt-0.5 shrink-0" aria-hidden />
                  <span className="text-[var(--text-secondary)]">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Lifecycle notice — expiring soon / grace / cancelled / expired */}
        <LifecycleNotice lifecycle={membership.lifecycle} audience="patient" />

        {/* Compare / upgrade — hidden entirely on the highest tier */}
        {membership.showUpgrade && (
          <section id="plans" className="mt-10">
            <h2 className="t-h3">Compare plans</h2>
            <p className="t-small mt-1">Upgrade any time. Free booking always stays free.</p>
            <div className="mt-4">
              <PlanComparison plans={PATIENT_PLANS} currentPlanId={membership.plan} />
            </div>
          </section>
        )}

        <div className="mt-8 flex items-center justify-between t-small">
          <Link href="/bookings" className="font-medium text-[var(--text-brand)] hover:underline">
            ← Back to my bookings
          </Link>
          <Link href="/account/billing" className="font-medium text-[var(--text-brand)] hover:underline">
            Billing &amp; invoices →
          </Link>
        </div>
      </main>
    </>
  );
}
