import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { InvoiceHistory } from "@/components/invoice-history";
import { PaymentMethodsPlaceholder } from "@/components/payment-methods";
import { createClient } from "@/lib/supabase/server";
import { listInvoices } from "@/lib/billing";

export const dynamic = "force-dynamic";

export default async function PatientBillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/account/billing");

  const invoices = await listInvoices(user.id);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="t-eyebrow">Account</p>
        <h1 className="t-h1 mt-2">Billing &amp; invoices</h1>
        <p className="t-small mt-1">Your membership invoices and payment methods.</p>

        <section className="mt-8">
          <h2 className="t-h3 mb-3">Invoice history</h2>
          <InvoiceHistory invoices={invoices} />
        </section>

        <section className="mt-8 max-w-md">
          <PaymentMethodsPlaceholder />
        </section>

        <p className="mt-8 t-small">
          <Link href="/account/membership" className="font-medium text-[var(--text-brand)] hover:underline">
            ← Back to membership
          </Link>
        </p>
      </main>
    </>
  );
}
