import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Stethoscope } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMyDoctor } from "@/lib/doctor";
import { DoctorNav } from "@/components/doctor-nav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in?next=/dashboard");

  const doctor = await getMyDoctor();

  // Signed in, but this account isn't a doctor. Show a clean, role-appropriate
  // access screen — never internal/developer detail. (Linking a demo doctor
  // account is documented in the project README.)
  if (!doctor) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "var(--bg-brandSubtle)" }}
        >
          <Stethoscope size={26} color="var(--text-brand)" aria-hidden />
        </span>
        <h1 className="mt-4 text-[1.5rem] font-bold text-[var(--text-primary)]">
          The doctor portal
        </h1>
        <p className="mt-2 text-[var(--text-muted)]">
          This area is for verified doctors. Your account doesn&apos;t have a
          doctor profile, so there&apos;s nothing to manage here.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/doctors"
            className="inline-flex h-11 items-center rounded-[var(--radius-md)] px-5 font-medium"
            style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
          >
            Find a doctor
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-[var(--radius-md)] border border-[var(--border-control)] px-5 font-medium text-[var(--text-primary)] hover:bg-[var(--bg-sunken)]"
          >
            Back to Curo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <DoctorNav doctorName={doctor.full_name} />
      <div className="flex-1 bg-[var(--bg-canvas)]">{children}</div>
    </div>
  );
}
