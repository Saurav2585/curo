import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand";
import { createClient } from "@/lib/supabase/server";
import { AccountStep } from "./account-step";
import { DetailForm } from "./detail-form";

export const dynamic = "force-dynamic";

export default async function ApplyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not signed in → step 1: create the account + draft.
  if (!user) {
    return (
      <Shell
        title="List your practice on Curo"
        subtitle="Create your provider account to begin. We verify every provider before your profile goes live."
      >
        <AccountStep />
      </Shell>
    );
  }

  // Signed in → load their application.
  const { data: app } = await supabase
    .from("provider_applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // No draft yet (e.g. a patient who wandered here) → let them start one.
  if (!app) {
    return (
      <Shell title="List your practice on Curo" subtitle="Create your provider profile to begin.">
        <AccountStep />
      </Shell>
    );
  }

  // Already moved past draft → the status page owns the rest of the journey.
  if (!["draft", "info_requested"].includes(app.status)) redirect("/apply/status");

  return (
    <Shell
      title="Complete your application"
      subtitle="Fill in your details and upload your documents. You can save a draft and finish later."
    >
      <DetailForm draft={app} userId={user.id} />
    </Shell>
  );
}

function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-8 flex items-center justify-center" aria-label="Curo home">
        <Logo className="h-10 w-auto" />
      </Link>
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
        <p className="t-eyebrow">For doctors &amp; clinics</p>
        <h1 className="mt-2 text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">{title}</h1>
        <p className="mt-1 mb-6 text-[0.9375rem] text-[var(--text-muted)]">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}
