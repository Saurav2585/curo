import Link from "next/link";
import { XCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getSessionRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function PaymentFailedPage() {
  const session = await getSessionRole();
  const backHref = session?.role === "doctor" ? "/dashboard/billing" : "/account/membership";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--bg-dangerSubtle)" }}>
          <XCircle size={30} color="var(--text-danger)" aria-hidden />
        </span>
        <h1 className="mt-4 text-[1.5rem] font-bold text-[var(--text-primary)]">Payment not completed</h1>
        <p className="mt-2 text-[var(--text-muted)]">
          No charge was made and your plan is unchanged. You can try again whenever you&apos;re ready.
        </p>
        <Link
          href={backHref}
          className="mt-6 inline-flex h-11 items-center rounded-[var(--radius-md)] px-5 font-medium"
          style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
        >
          Back to plans
        </Link>
      </main>
    </>
  );
}
