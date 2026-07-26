import Link from "next/link";
import { Logo } from "@/components/brand";
import { UpdateForm } from "./update-form";

export const dynamic = "force-dynamic";

export default function UpdatePasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 flex items-center justify-center" aria-label="Curo home">
        <Logo className="h-10 w-auto" />
      </Link>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)]">
        <h1 className="text-[1.5rem] font-semibold text-[var(--text-primary)]">Set a new password</h1>
        <p className="mt-1 mb-6 text-[0.9375rem] text-[var(--text-muted)]">
          Choose a new password for your account.
        </p>
        <UpdateForm />
      </div>
    </main>
  );
}
