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

  // Signed in, but not linked to a doctor profile yet. Rather than a bare
  // "403", explain how to claim one — this is a demo, and the reviewer needs a
  // way in.
  if (!doctor) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <Stethoscope size={32} color="var(--text-brand)" className="mx-auto" aria-hidden />
        <h1 className="mt-4 text-[1.5rem] font-bold text-[var(--text-primary)]">
          This account isn&apos;t a doctor yet
        </h1>
        <p className="mt-2 text-[var(--text-muted)]">
          To preview the doctor portal, claim a seeded profile. In the Supabase
          SQL editor, run:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] p-3 text-left text-[0.8125rem] text-[var(--text-primary)]">
          select claim_doctor_profile(&apos;ananya-sharma&apos;);
        </pre>
        <p className="mt-3 text-[0.8125rem] text-[var(--text-muted)]">
          Then reload this page. Use any seeded slug: ananya-sharma, rajesh-iyer,
          meera-nair…
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-[0.9375rem] font-medium text-[var(--text-brand)] hover:underline"
        >
          ← Back to Curo
        </Link>
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
