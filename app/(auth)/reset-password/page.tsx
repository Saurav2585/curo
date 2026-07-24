import Link from "next/link";
import { KeyRound } from "lucide-react";
import { ResetForm } from "./reset-form";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]"
          style={{ background: "var(--bg-brand)" }}
        >
          <KeyRound size={20} color="var(--text-onBrand)" aria-hidden />
        </span>
        <span className="text-[1.5rem] font-semibold text-[var(--text-primary)]">Curo</span>
      </Link>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)]">
        <h1 className="text-[1.5rem] font-semibold text-[var(--text-primary)]">Reset your password</h1>
        <p className="mt-1 mb-6 text-[0.9375rem] text-[var(--text-muted)]">
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>
        <ResetForm />
      </div>

      <p className="mt-6 text-center text-[0.8125rem] text-[var(--text-muted)]">
        Remembered it?{" "}
        <Link href="/sign-in" className="font-medium text-[var(--text-brand)] hover:underline">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
