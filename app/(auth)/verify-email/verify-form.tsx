"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { verifyEmailCode, resendCode, type VerifyState } from "../actions";

function VerifyButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="h-12 w-full rounded-[var(--radius-md)] font-medium disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
    >
      {pending ? "Verifying…" : "Verify email"}
    </button>
  );
}

export function VerifyForm({ email, next }: { email: string; next: string }) {
  const [state, formAction] = useActionState<VerifyState, FormData>(verifyEmailCode, null);
  const [resendState, resendAction] = useActionState<VerifyState, FormData>(resendCode, null);

  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(60);
  const resendRef = useRef<HTMLButtonElement>(null);

  // Countdown for the resend link.
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  // Restart the countdown whenever a resend succeeds.
  useEffect(() => {
    if (resendState?.info) setSeconds(60);
  }, [resendState]);

  const valid = /^\d{6}$/.test(code);

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />

        <div>
          <label htmlFor="code" className="sr-only">
            6-digit verification code
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="tabular h-14 w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] text-center text-[1.75rem] font-semibold tracking-[0.4em] text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
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

        {resendState?.info && (
          <div
            className="flex items-start gap-2 rounded-[var(--radius-md)] border p-3 text-[0.8125rem]"
            style={{ borderColor: "var(--border-brand)", background: "var(--bg-successSubtle)" }}
          >
            <CheckCircle2 size={16} color="var(--text-success)" className="mt-0.5 shrink-0" aria-hidden />
            <span className="text-[var(--text-success)]">{resendState.info}</span>
          </div>
        )}

        <VerifyButton disabled={!valid} />
      </form>

      <div className="text-center text-[0.875rem] text-[var(--text-muted)]">
        Didn&apos;t get it?{" "}
        {seconds > 0 ? (
          <span className="tabular">Resend in {seconds}s</span>
        ) : (
          <form action={resendAction} className="inline">
            <input type="hidden" name="email" value={email} />
            <button
              ref={resendRef}
              type="submit"
              className="font-medium text-[var(--text-brand)] hover:underline"
            >
              Resend code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
