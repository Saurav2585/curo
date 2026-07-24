"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { submitProviderApplication, type ApplyState } from "./actions";

const INPUT =
  "mt-1 h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none";
const LABEL = "text-[0.8125rem] font-medium text-[var(--text-secondary)]";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="h-12 w-full rounded-[var(--radius-md)] font-medium disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
    >
      {pending ? "Submitting…" : "Submit application"}
    </button>
  );
}

export function ApplyForm() {
  const [state, formAction] = useActionState<ApplyState, FormData>(
    submitProviderApplication,
    null
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = agreed && password.length >= 6 && confirm === password;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {/* Account */}
      <fieldset className="space-y-4">
        <legend className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--text-brand)]">
          Your account
        </legend>
        <div>
          <label htmlFor="full_name" className={LABEL}>Full name</label>
          <input id="full_name" name="full_name" autoComplete="name" required className={INPUT} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className={LABEL}>Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required className={INPUT} />
          </div>
          <div>
            <label htmlFor="phone" className={LABEL}>Phone <span className="font-normal text-[var(--text-muted)]">(optional)</span></label>
            <input id="phone" name="phone" type="tel" autoComplete="tel" className={INPUT} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className={LABEL}>Password</label>
            <input
              id="password" name="password" type="password" autoComplete="new-password" required minLength={6}
              value={password} onChange={(e) => setPassword(e.target.value)} className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="confirm_password" className={LABEL}>Confirm password</label>
            <input
              id="confirm_password" type="password" autoComplete="new-password" required
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={mismatch} className={INPUT}
              style={mismatch ? { borderColor: "var(--border-danger)" } : undefined}
            />
            {mismatch && <p className="mt-1 text-[0.75rem] text-[var(--text-danger)]">Passwords don&apos;t match.</p>}
          </div>
        </div>
      </fieldset>

      {/* Practice */}
      <fieldset className="space-y-4">
        <legend className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--text-brand)]">
          Your practice
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="clinic_name" className={LABEL}>Clinic / hospital name</label>
            <input id="clinic_name" name="clinic_name" required className={INPUT} />
          </div>
          <div>
            <label htmlFor="city" className={LABEL}>City</label>
            <input id="city" name="city" required className={INPUT} />
          </div>
        </div>
        <div>
          <label htmlFor="specialty" className={LABEL}>Specialty</label>
          <input id="specialty" name="specialty" placeholder="e.g. Cardiology" required className={INPUT} />
        </div>
      </fieldset>

      {/* Verification */}
      <fieldset className="space-y-4">
        <legend className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--text-brand)]">
          Professional verification
        </legend>
        <div>
          <label htmlFor="registration_number" className={LABEL}>Medical registration number</label>
          <input id="registration_number" name="registration_number" required className={INPUT} />
        </div>
        <div>
          <label htmlFor="qualifications" className={LABEL}>Qualifications</label>
          <input id="qualifications" name="qualifications" placeholder="e.g. MBBS, MD (Cardiology)" required className={INPUT} />
        </div>
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          Our team verifies every provider before your profile goes live. We may
          contact you for supporting documents.
        </p>
      </fieldset>

      <label className="flex items-start gap-2.5 text-[0.8125rem] text-[var(--text-secondary)]">
        <input
          type="checkbox" name="terms" checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[var(--color-teal-500)]"
        />
        <span>
          I confirm the information is accurate and agree to the{" "}
          <Link href="/terms" className="font-medium text-[var(--text-brand)] hover:underline">Terms of Service</Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-medium text-[var(--text-brand)] hover:underline">Privacy Policy</Link>.
        </span>
      </label>

      {state?.error && (
        <div
          className="flex items-start gap-2 rounded-[var(--radius-md)] border p-3 text-[0.8125rem]"
          style={{ borderColor: "var(--border-danger)", background: "var(--bg-dangerSubtle)" }}
          role="alert"
        >
          <AlertCircle size={16} color="var(--text-danger)" className="mt-0.5 shrink-0" aria-hidden />
          <span className="text-[var(--text-danger)]">{state.error}</span>
        </div>
      )}

      <SubmitButton disabled={!canSubmit} />

      <p className="text-center text-[0.875rem] text-[var(--text-muted)]">
        Booking as a patient instead?{" "}
        <Link href="/sign-up" className="font-medium text-[var(--text-brand)] hover:underline">Patient sign up</Link>
      </p>
    </form>
  );
}
