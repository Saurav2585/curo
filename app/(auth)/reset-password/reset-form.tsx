"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { requestPasswordReset, type VerifyState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 w-full rounded-[var(--radius-md)] font-medium disabled:opacity-60"
      style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
    >
      {pending ? "Sending…" : "Send reset link"}
    </button>
  );
}

export function ResetForm() {
  const [state, formAction] = useActionState<VerifyState, FormData>(requestPasswordReset, null);

  if (state?.info) {
    return (
      <div
        className="flex items-start gap-2 rounded-[var(--radius-md)] border p-4 text-[0.875rem]"
        style={{ borderColor: "var(--border-brand)", background: "var(--bg-successSubtle)" }}
      >
        <CheckCircle2 size={18} color="var(--text-success)" className="mt-0.5 shrink-0" aria-hidden />
        <span className="text-[var(--text-success)]">{state.info}</span>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="text-[0.8125rem] font-medium text-[var(--text-secondary)]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          className="mt-1 h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
        />
      </div>

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

      <SubmitButton />
    </form>
  );
}
