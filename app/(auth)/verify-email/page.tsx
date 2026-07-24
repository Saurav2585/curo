import Link from "next/link";
import { redirect } from "next/navigation";
import { MailCheck } from "lucide-react";
import { VerifyForm } from "./verify-form";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email, next } = await searchParams;

  // No email in the URL means someone landed here directly — send them to sign up.
  if (!email) redirect("/sign-up");

  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/bookings";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]"
          style={{ background: "var(--bg-brand)" }}
        >
          <MailCheck size={20} color="var(--text-onBrand)" aria-hidden />
        </span>
        <span className="text-[1.5rem] font-semibold text-[var(--text-primary)]">Curo</span>
      </Link>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)]">
        <h1 className="text-[1.5rem] font-semibold text-[var(--text-primary)]">Verify your email</h1>
        <p className="mt-1 mb-6 text-[0.9375rem] text-[var(--text-muted)]">
          We sent a 6-digit verification code to{" "}
          <span className="font-medium text-[var(--text-secondary)]">{email}</span>.
        </p>

        <VerifyForm email={email} next={safeNext} />
      </div>

      <p className="mt-6 text-center text-[0.8125rem] text-[var(--text-muted)]">
        Wrong address?{" "}
        <Link href="/sign-up" className="font-medium text-[var(--text-brand)] hover:underline">
          Start over
        </Link>
      </p>
    </main>
  );
}
