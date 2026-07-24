"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { updatePassword, type AuthState } from "../../actions";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="h-12 w-full rounded-[var(--radius-md)] font-medium disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
    >
      {pending ? "Saving…" : "Set new password"}
    </button>
  );
}

export function UpdateForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(updatePassword, null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = password.length >= 6 && confirm === password;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <label htmlFor="password" className="text-[0.8125rem] font-medium text-[var(--text-secondary)]">
          New password
        </label>
        <input
          id="password" name="password" type="password" autoComplete="new-password" required minLength={6}
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="mt-1 h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="confirm_password" className="text-[0.8125rem] font-medium text-[var(--text-secondary)]">
          Confirm new password
        </label>
        <input
          id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" required
          value={confirm} onChange={(e) => setConfirm(e.target.value)}
          aria-invalid={mismatch}
          className="mt-1 h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
          style={mismatch ? { borderColor: "var(--border-danger)" } : undefined}
        />
        {mismatch && <p className="mt-1 text-[0.75rem] text-[var(--text-danger)]">Passwords don&apos;t match.</p>}
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

      <SubmitButton disabled={!canSubmit} />
    </form>
  );
}
