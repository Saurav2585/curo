import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { AuthForm } from "../auth-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]"
          style={{ background: "var(--bg-brand)" }}
        >
          <CalendarCheck size={20} color="var(--text-onBrand)" aria-hidden />
        </span>
        <span className="text-[1.5rem] font-semibold text-[var(--text-primary)]">Curo</span>
      </Link>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)]">
        <h1 className="text-[1.5rem] font-semibold text-[var(--text-primary)]">Welcome back</h1>
        <p className="mt-1 mb-6 text-[0.9375rem] text-[var(--text-muted)]">
          {next?.includes("/book")
            ? "Your slot is held while you sign in."
            : "Sign in to manage your appointments."}
        </p>
        <AuthForm mode="sign-in" next={next} />
      </div>
    </main>
  );
}
