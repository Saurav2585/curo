"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, User, Building2, Hospital } from "lucide-react";
import { startApplication, type ApplyState } from "./actions";

const INPUT =
  "mt-1 h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none";
const LABEL = "text-[0.8125rem] font-medium text-[var(--text-secondary)]";

const TYPES = [
  { value: "solo", label: "Solo doctor", desc: "An independent practitioner.", icon: User },
  { value: "clinic", label: "Clinic", desc: "A practice with several doctors.", icon: Building2 },
  { value: "hospital", label: "Hospital", desc: "A multi-department institution.", icon: Hospital },
] as const;

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="h-12 w-full rounded-[var(--radius-md)] font-medium disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
    >
      {pending ? "Creating…" : "Create account & continue"}
    </button>
  );
}

export function AccountStep() {
  const [state, formAction] = useActionState<ApplyState, FormData>(startApplication, null);
  const [type, setType] = useState<"solo" | "clinic" | "hospital">("solo");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = password.length >= 6 && confirm === password;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="provider_type" value={type} />

      <div>
        <p className={LABEL}>I&apos;m registering as</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {TYPES.map((t) => {
            const active = type === t.value;
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className="rounded-[var(--radius-md)] border p-3 text-left transition-colors"
                style={{
                  borderColor: active ? "var(--border-brand)" : "var(--border-subtle)",
                  background: active ? "var(--bg-brandSubtle)" : "var(--bg-surface)",
                }}
              >
                <Icon size={18} color={active ? "var(--text-brand)" : "var(--text-muted)"} aria-hidden />
                <span className="mt-1.5 block text-[0.875rem] font-medium text-[var(--text-primary)]">{t.label}</span>
                <span className="block text-[0.75rem] text-[var(--text-muted)]">{t.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="full_name" className={LABEL}>Full name</label>
        <input id="full_name" name="full_name" autoComplete="name" required className={INPUT} />
      </div>
      <div>
        <label htmlFor="email" className={LABEL}>Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={INPUT} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="password" className={LABEL}>Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={6}
            value={password} onChange={(e) => setPassword(e.target.value)} className={INPUT} />
        </div>
        <div>
          <label htmlFor="confirm" className={LABEL}>Confirm password</label>
          <input id="confirm" type="password" autoComplete="new-password" required
            value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={mismatch} className={INPUT}
            style={mismatch ? { borderColor: "var(--border-danger)" } : undefined} />
          {mismatch && <p className="mt-1 text-[0.75rem] text-[var(--text-danger)]">Passwords don&apos;t match.</p>}
        </div>
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 rounded-[var(--radius-md)] border p-3 text-[0.8125rem]"
          style={{ borderColor: "var(--border-danger)", background: "var(--bg-dangerSubtle)" }} role="alert">
          <AlertCircle size={16} color="var(--text-danger)" className="mt-0.5 shrink-0" aria-hidden />
          <span className="text-[var(--text-danger)]">{state.error}</span>
        </div>
      )}

      <SubmitButton disabled={!canSubmit} />

      <p className="text-center text-[0.875rem] text-[var(--text-muted)]">
        Already started?{" "}
        <Link href="/sign-in?next=/apply" className="font-medium text-[var(--text-brand)] hover:underline">Sign in to continue</Link>
      </p>
    </form>
  );
}
