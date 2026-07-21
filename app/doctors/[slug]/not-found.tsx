import Link from "next/link";
import { UserX } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

/** Error state from the screen inventory: unknown slug never dead-ends. */
export default function DoctorNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <UserX size={32} color="var(--text-disabled)" className="mx-auto" aria-hidden />
        <h1 className="mt-4 text-[2rem] font-bold text-[var(--text-primary)]">
          This doctor isn&apos;t listed
        </h1>
        <p className="mt-2 text-[var(--text-muted)]">
          They may have left the practice, or the link may be out of date.
        </p>
        <Link
          href="/doctors"
          className="mt-6 inline-flex h-11 items-center rounded-[var(--radius-md)] px-5 font-medium"
          style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
        >
          Browse all doctors
        </Link>
      </main>
    </>
  );
}
