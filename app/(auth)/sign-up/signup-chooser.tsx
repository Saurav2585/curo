"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Stethoscope, ArrowRight } from "lucide-react";
import { AuthForm } from "../auth-form";

/**
 * UX-only separation of the two signup journeys. Both use the SAME Supabase
 * backend — this only chooses which onboarding path to show. Patients get the
 * existing form inline; providers are sent to the /apply application.
 */
export function SignupChooser({ next }: { next?: string }) {
  const [mode, setMode] = useState<"choose" | "patient">("choose");

  if (mode === "patient") {
    return (
      <div>
        <button
          type="button"
          onClick={() => setMode("choose")}
          className="mb-4 text-[0.8125rem] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          ← Choose a different account type
        </button>
        <AuthForm mode="sign-up" next={next} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setMode("patient")}
        className="ring-hairline lift flex w-full items-center gap-4 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-5 text-left"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--bg-brandSubtle)" }}>
          <User size={22} color="var(--text-brand)" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-semibold text-[var(--text-primary)]">Continue as a patient</span>
          <span className="block text-[0.8125rem] text-[var(--text-muted)]">Book appointments and manage your visits.</span>
        </span>
        <ArrowRight size={18} className="text-[var(--text-muted)]" aria-hidden />
      </button>

      <Link
        href="/apply"
        className="ring-hairline lift flex w-full items-center gap-4 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-5 text-left"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--bg-brandSubtle)" }}>
          <Stethoscope size={22} color="var(--text-brand)" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-semibold text-[var(--text-primary)]">Continue as a doctor or clinic</span>
          <span className="block text-[0.8125rem] text-[var(--text-muted)]">List your practice and manage your schedule.</span>
        </span>
        <ArrowRight size={18} className="text-[var(--text-muted)]" aria-hidden />
      </Link>

      <p className="pt-2 text-center text-[0.875rem] text-[var(--text-muted)]">
        Already have an account?{" "}
        <Link href={`/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-[var(--text-brand)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
