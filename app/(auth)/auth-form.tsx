"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { signIn, signUp, type AuthState } from "./actions";
import { SocialAuth } from "./social-auth";

const INPUT =
  "mt-1 h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none";
const LABEL = "text-[0.8125rem] font-medium text-[var(--text-secondary)]";

function SubmitButton({ label, disabled }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="h-12 w-full rounded-[var(--radius-md)] font-medium disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
    >
      {pending ? "One moment…" : label}
    </button>
  );
}

export function AuthForm({
  mode,
  next,
}: {
  mode: "sign-in" | "sign-up";
  next?: string;
}) {
  const isSignUp = mode === "sign-up";
  const action = isSignUp ? signUp : signIn;
  const [state, formAction] = useActionState<AuthState, FormData>(action, null);

  // Client-side validation state (sign-up only; sign-in uses native + server).
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  // Sign-in "Continue as" toggle — tailors the sign-up / apply call-to-action.
  // Authentication itself is unified: the real role is resolved from the account
  // and the redirect goes to the right home regardless of this choice.
  const [loginRole, setLoginRole] = useState<"patient" | "doctor">("patient");

  const mismatch = isSignUp && confirm.length > 0 && confirm !== password;
  const canSubmit = !isSignUp || (agreed && password.length >= 6 && confirm === password);

  return (
    <div className="space-y-5">
      {!isSignUp && (
        <div>
          <p className="mb-2 text-[0.75rem] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Continue as
          </p>
          <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-lg)] bg-[var(--bg-sunken)] p-1">
            {(["patient", "doctor"] as const).map((r) => {
              const on = loginRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setLoginRole(r)}
                  aria-pressed={on}
                  className={
                    on
                      ? "rounded-[var(--radius-md)] bg-[var(--bg-surface)] py-2 text-[0.9375rem] font-medium text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
                      : "rounded-[var(--radius-md)] py-2 text-[0.9375rem] font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  }
                >
                  {r === "patient" ? "Patient" : "Doctor"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <SocialAuth next={next} />

      <form action={formAction} className="space-y-4" noValidate>
        {next && <input type="hidden" name="next" value={next} />}

        {isSignUp && (
          <div>
            <label htmlFor="full_name" className={LABEL}>Full name</label>
            <input id="full_name" name="full_name" autoComplete="name" required className={INPUT} />
          </div>
        )}

        <div>
          <label htmlFor="email" className={LABEL}>Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className={INPUT} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={LABEL}>Password</label>
            {!isSignUp && (
              <Link
                href={`/reset-password${next ? `?next=${encodeURIComponent(next)}` : ""}`}
                className="text-[0.75rem] text-[var(--text-muted)] hover:text-[var(--text-brand)] hover:underline"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            minLength={isSignUp ? 6 : undefined}
            value={isSignUp ? password : undefined}
            onChange={isSignUp ? (e) => setPassword(e.target.value) : undefined}
            className={INPUT}
          />
        </div>

        {isSignUp && (
          <div>
            <label htmlFor="confirm_password" className={LABEL}>Confirm password</label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={mismatch}
              className={INPUT}
              style={mismatch ? { borderColor: "var(--border-danger)" } : undefined}
            />
            {mismatch && (
              <p className="mt-1 text-[0.75rem] text-[var(--text-danger)]">
                Passwords don&apos;t match.
              </p>
            )}
          </div>
        )}

        {isSignUp && (
          <label className="flex items-start gap-2.5 text-[0.8125rem] text-[var(--text-secondary)]">
            <input
              type="checkbox"
              name="terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[var(--color-teal-500)]"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="font-medium text-[var(--text-brand)] hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-medium text-[var(--text-brand)] hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
        )}

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

        <SubmitButton label={isSignUp ? "Create account" : "Sign in"} disabled={!canSubmit} />

        {isSignUp ? (
          <p className="text-center text-[0.875rem] text-[var(--text-muted)]">
            Already have an account?{" "}
            <Link
              href={`/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-medium text-[var(--text-brand)] hover:underline"
            >
              Sign in
            </Link>
          </p>
        ) : loginRole === "doctor" ? (
          <p className="text-center text-[0.875rem] text-[var(--text-muted)]">
            New provider?{" "}
            <Link href="/apply" className="font-medium text-[var(--text-brand)] hover:underline">
              Apply to join Curo
            </Link>
          </p>
        ) : (
          <p className="text-center text-[0.875rem] text-[var(--text-muted)]">
            New to Curo?{" "}
            <Link
              href={`/sign-up${next ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-medium text-[var(--text-brand)] hover:underline"
            >
              Create an account
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
