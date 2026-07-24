import Link from "next/link";
import { redirect } from "next/navigation";
import { Stethoscope } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ApplyForm } from "./apply-form";

export const dynamic = "force-dynamic";

export default async function ApplyPage() {
  // If a signed-in user already applied, send them to their status page.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: app } = await supabase
      .from("provider_applications")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (app) redirect("/apply/status");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]"
          style={{ background: "var(--bg-brand)" }}
        >
          <Stethoscope size={20} color="var(--text-onBrand)" aria-hidden />
        </span>
        <span className="text-[1.5rem] font-semibold text-[var(--text-primary)]">Curo</span>
      </Link>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
        <p className="t-eyebrow">For doctors &amp; clinics</p>
        <h1 className="mt-2 text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">
          List your practice on Curo
        </h1>
        <p className="mt-1 mb-6 text-[0.9375rem] text-[var(--text-muted)]">
          Tell us about you and your practice. We verify every provider before your
          profile goes live — you&apos;ll hear from us shortly after applying.
        </p>
        <ApplyForm />
      </div>
    </main>
  );
}
