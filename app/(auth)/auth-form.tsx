"use client";

import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { signIn, signUp, type AuthState } from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 w-full rounded-[var(--radius-md)] font-medium disabled:opacity-60"
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
  const action = mode === "sign-in" ? signIn : signUp;
  const [state, formAction] = useActionState<AuthState, FormData>(action, null);

  const isSignUp = mode === "sign-up";

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      {isSignUp && (
        <div>
          <label htmlFor="full_name" className="text-[0.8125rem] font-medium text-[var(--text-secondary)]">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            autoComplete="name"
            className="mt-1 h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="text-[0.8125rem] font-medium text-[var(--text-secondary)]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="mt-1 h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="password" className="text-[0.8125rem] font-medium text-[var(--text-secondary)]">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className="mt-1 h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
        />
      </div>

      {state?.error && (
        <div
          className="flex items-start gap-2 rounded-[var(--radius-md)] border p-3 text-[0.8125rem]"
          style={{ borderColor: "var(--border-danger)", background: "var(--bg-dangerSubtle)" }}
        >
          <AlertCircle size={16} color="var(--text-danger)" className="mt-0.5 shrink-0" aria-hidden />
          <span className="text-[var(--text-danger)]">{state.error}</span>
        </div>
      )}

      <SubmitButton label={isSignUp ? "Create account" : "Sign in"} />

      <p className="text-center text-[0.875rem] text-[var(--text-muted)]">
        {isSignUp ? "Already have an account? " : "New to Curo? "}
        <Link
          href={`/${isSignUp ? "sign-in" : "sign-up"}${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-[var(--text-brand)] hover:underline"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
