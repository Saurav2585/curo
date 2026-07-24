import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { PlanComparison } from "@/components/plan-comparison";
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

        {/* Current plan + usage */}
        <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.8125rem] text-[var(--text-muted)]">Current plan</p>
              <p className="mt-0.5 flex items-center gap-2 text-[1.375rem] font-semibold text-[var(--text-primary)]">
                {patientPlanName(membership.plan)}
                {membership.plan !== "free" && <Sparkles size={18} color="var(--text-brand)" aria-hidden />}
              </p>
            </div>
            {!membership.isHighestTier && (
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

        {/* Compare / upgrade */}
        {!membership.isHighestTier && (
          <section id="plans" className="mt-10">
            <h2 className="t-h3">Compare plans</h2>
            <p className="t-small mt-1">Upgrade any time. Free booking always stays free.</p>
            <div className="mt-4">
              <PlanComparison plans={PATIENT_PLANS} currentPlanId={membership.plan} />
            </div>
          </section>
        )}

        <p className="mt-8 t-small">
          <Link href="/bookings" className="font-medium text-[var(--text-brand)] hover:underline">
            ← Back to my bookings
          </Link>
        </p>
      </main>
    </>
  );
}
