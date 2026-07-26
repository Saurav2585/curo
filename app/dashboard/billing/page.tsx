import { redirect } from "next/navigation";
import { Clock, FileText, Sparkles, Headset, Mail, Check } from "lucide-react";
import { getMyDoctor } from "@/lib/doctor";
import { createClient } from "@/lib/supabase/server";
import { getProviderSubscription } from "@/lib/subscription";
import { PlanComparison } from "@/components/plan-comparison";
import { PlanBadge, PlanStatus } from "@/components/plan-badge";
import { LifecycleNotice } from "@/components/lifecycle-notice";
import { PromotionSlot } from "@/components/promotion-slot";
import { InvoiceHistory } from "@/components/invoice-history";
import { PaymentMethodsPlaceholder } from "@/components/payment-methods";
import { PROVIDER_PLANS, ENTERPRISE_PLAN } from "@/lib/plans";
import { planName } from "@/lib/entitlements";
import { listInvoices } from "@/lib/billing";
import { slotFull } from "@/lib/format";

export const dynamic = "force-dynamic";

function Placeholder({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof FileText;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "var(--bg-sunken)" }}>
        <Icon size={20} color="var(--text-muted)" aria-hidden />
      </span>
      <p className="mt-3 font-medium text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 text-[0.875rem] text-[var(--text-muted)]">{body}</p>
    </div>
  );
}

export default async function BillingPage() {
  const doctor = await getMyDoctor();
  if (!doctor) redirect("/dashboard"); // layout owns the non-doctor gate

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sub = await getProviderSubscription(doctor.id, user!.id);
  const invoices = await listInvoices(user!.id);

  // ---------------------------------------------------- Enterprise (hospital)
  if (sub.isEnterprise) {
    return (
      <main className="p-8">
        <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">Billing &amp; Plan</h1>

        <div className="mt-6 max-w-2xl rounded-[var(--radius-lg)] border p-6" style={{ borderColor: "var(--border-brand)", background: "var(--bg-brandSubtle)" }}>
          <p className="text-[0.8125rem] text-[var(--text-muted)]">Current plan</p>
          <p className="mt-0.5 text-[1.5rem] font-bold text-[var(--text-primary)]">Enterprise</p>
          <p className="mt-1 text-[0.9375rem] text-[var(--text-secondary)]">{ENTERPRISE_PLAN.tagline}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {ENTERPRISE_PLAN.benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-[0.875rem]">
                <Check size={15} color="var(--text-success)" className="mt-0.5 shrink-0" aria-hidden />
                <span className="text-[var(--text-secondary)]">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <p className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
              <Headset size={16} color="var(--text-brand)" aria-hidden /> Account manager
            </p>
            <p className="mt-1 text-[0.875rem] text-[var(--text-muted)]">
              Your dedicated manager handles plan changes, branches and seats.
            </p>
            <a href="mailto:enterprise@curo.demo" className="mt-2 inline-block text-[0.875rem] font-medium text-[var(--text-brand)] hover:underline">
              enterprise@curo.demo
            </a>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <p className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
              <Mail size={16} color="var(--text-brand)" aria-hidden /> Billing contact
            </p>
            <p className="mt-1 text-[0.875rem] text-[var(--text-muted)]">
              Invoices and finance queries go to your billing contact.
            </p>
            <a href="mailto:billing@curo.demo" className="mt-2 inline-block text-[0.875rem] font-medium text-[var(--text-brand)] hover:underline">
              billing@curo.demo
            </a>
          </div>
        </div>
        <p className="mt-4 text-[0.8125rem] text-[var(--text-muted)]">
          Enterprise plans are managed with our team — there&apos;s no self-service upgrade.
        </p>
      </main>
    );
  }

  // ---------------------------------------------------- Solo / Clinic
  return (
    <main className="p-8">
      <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">Billing &amp; Plan</h1>

      {/* Promotion slot — provider billing placement */}
      <div className="mt-6 max-w-5xl">
        <PromotionSlot placement="billing" plan={sub.plan} />
      </div>

      {/* Current plan + state */}
      <div className="mt-6 max-w-5xl rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.8125rem] text-[var(--text-muted)]">Current plan</p>
            <p className="mt-0.5 flex items-center gap-2 text-[1.375rem] font-semibold text-[var(--text-primary)]">
              {sub.onTrial ? "Professional Trial" : planName(sub.plan)}
              <PlanBadge plan={sub.plan} />
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PlanStatus state={sub.state} />
            {sub.onTrial && (
              <span
                className="tabular flex items-center gap-1.5 rounded-[var(--radius-full)] px-3 py-1 text-[0.8125rem] font-medium"
                style={
                  sub.trialUrgent
                    ? { background: "var(--bg-warnSubtle)", color: "var(--text-warn)" }
                    : { background: "var(--bg-brandSubtle)", color: "var(--text-brand)" }
                }
              >
                <Clock size={14} aria-hidden /> {sub.daysRemaining} days left
              </span>
            )}
          </div>
        </div>

        {/* Trial → keep-until note. Paid plans → renewal date. Clinic Pro → extras. */}
        {sub.onTrial && sub.trialEndsAt ? (
          <p className="mt-3 border-t border-[var(--border-subtle)] pt-3 text-[0.875rem] text-[var(--text-muted)]">
            Your trial runs until <span className="tabular font-medium text-[var(--text-secondary)]">{slotFull(sub.trialEndsAt.toISOString())}</span>.
            You keep everything until then — no card required.
          </p>
        ) : sub.renewalDate ? (
          <p className="mt-3 border-t border-[var(--border-subtle)] pt-3 text-[0.875rem] text-[var(--text-muted)]">
            Renews {sub.lifecycle.governingDate ? "on" : "monthly ·"}{" "}
            <span className="tabular font-medium text-[var(--text-secondary)]">{slotFull(sub.renewalDate.toISOString())}</span>.
          </p>
        ) : null}

        {sub.plan === "clinic" && (
          <div className="mt-3 border-t border-[var(--border-subtle)] pt-3">
            <p className="text-[0.8125rem] font-medium text-[var(--text-secondary)]">Included with Clinic Pro</p>
            <p className="mt-1 text-[0.8125rem] text-[var(--text-muted)]">
              Up to 10 doctors · per-doctor + clinic analytics · 3 reception seats · 1 branch.
            </p>
          </div>
        )}
      </div>

      {/* Lifecycle notice — expiring soon / grace / cancelled / expired */}
      <LifecycleNotice lifecycle={sub.lifecycle} audience="provider" />

      {/* Plan comparison — hidden on the highest self-serve tier (Clinic Pro) */}
      {sub.showUpgrade && (
        <section className="mt-10">
          <h2 className="text-[1.25rem] font-semibold text-[var(--text-primary)]">Compare plans</h2>
          <p className="mt-1 text-[0.875rem] text-[var(--text-muted)]">Flat pricing, zero commission on every booking.</p>
          <div className="mt-4 max-w-5xl">
            <PlanComparison plans={PROVIDER_PLANS} currentPlanId={sub.onTrial ? undefined : sub.plan} />
          </div>
        </section>
      )}

      {/* Invoice history (GST invoices) */}
      <section className="mt-10 max-w-5xl">
        <h2 className="text-[1.25rem] font-semibold text-[var(--text-primary)]">Invoice history</h2>
        <p className="mt-1 text-[0.875rem] text-[var(--text-muted)]">GST invoices for your subscription.</p>
        <div className="mt-4">
          <InvoiceHistory invoices={invoices} />
        </div>
      </section>

      {/* Payment method + visibility placeholders */}
      <section className="mt-8 grid max-w-5xl gap-4 sm:grid-cols-2">
        <PaymentMethodsPlaceholder />
        <Placeholder icon={Sparkles} title="Visibility packs" body="Featured & sponsored placement — coming soon." />
      </section>
    </main>
  );
}
