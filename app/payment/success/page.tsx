import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getSessionRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function PaymentSuccessPage() {
  const session = await getSessionRole();
  const backHref = session?.role === "doctor" ? "/dashboard/billing" : "/account/billing";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--bg-successSubtle)" }}>
          <CheckCircle2 size={30} color="var(--text-success)" aria-hidden />
        </span>
        <h1 className="mt-4 text-[1.5rem] font-bold text-[var(--text-primary)]">Payment successful</h1>
        <p className="mt-2 text-[var(--text-muted)]">
          Your subscription is now active. A GST invoice has been added to your billing history.
        </p>
        <Link
          href={backHref}
          className="mt-6 inline-flex h-11 items-center rounded-[var(--radius-md)] px-5 font-medium"
          style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
        >
          View billing &amp; invoices
        </Link>
      </main>
    </>
  );
}
