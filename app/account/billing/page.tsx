import Link from "next/link";
import { redirect } from "next/navigation";
import { InvoiceHistory } from "@/components/invoice-history";
import { PaymentMethodsPlaceholder } from "@/components/payment-methods";
import { PlanBadge } from "@/components/plan-badge";
import { createClient } from "@/lib/supabase/server";
import { listInvoices } from "@/lib/billing";
import { getPatientMembership } from "@/lib/subscription";
import { patientPlanName } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function PatientBillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/account/billing");

  const [invoices, membership] = await Promise.all([listInvoices(user.id), getPatientMembership()]);
  const plan = membership?.plan ?? "free";
  const isFree = membership?.isFree ?? true;

  return (
    <main className="p-8">
      <h1 className="t-h1">Billing &amp; invoices</h1>
      <p className="t-small mt-1">Your membership invoices and payment methods.</p>

      <section className="mt-8">
        <h2 className="t-h3 mb-3">Invoice history</h2>
        <InvoiceHistory invoices={invoices} />
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <PaymentMethodsPlaceholder />

        {/* Plan summary — fills the row and gives billing a next action */}
        <div className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <p className="font-medium text-[var(--text-primary)]">Your plan</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[1.25rem] font-semibold text-[var(--text-primary)]">
              {patientPlanName(plan)}
            </span>
            <PlanBadge plan={plan} />
          </div>
          <p className="mt-2 text-[0.8125rem] text-[var(--text-muted)]">
            {isFree
              ? "Upgrade to Care+ for unlimited appointments, priority support, SMS reminders and lab-test discounts."
              : "You're on Care+ — unlimited appointments and premium benefits. Manage or cancel any time."}
          </p>
          <Link
            href="/account/membership"
            className="mt-auto inline-flex h-9 w-fit items-center rounded-[var(--radius-md)] px-4 text-[0.8125rem] font-medium"
            style={
              isFree
                ? { background: "var(--bg-brand)", color: "var(--text-onBrand)" }
                : { border: "1px solid var(--border-control)", color: "var(--text-primary)" }
            }
          >
            {isFree ? "Upgrade to Care+" : "Manage membership"}
          </Link>
        </div>
      </section>

      <p className="mt-8 t-small">
        <Link href="/account/membership" className="font-medium text-[var(--text-brand)] hover:underline">
          ← Back to membership
        </Link>
      </p>
    </main>
  );
}
