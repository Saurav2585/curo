import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand";
import { AuthForm } from "../auth-form";
import { getSessionRole, roleHome } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // Already signed in — no reason to show the login form. Go to a sensible home.
  const session = await getSessionRole();
  if (session) {
    redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : roleHome(session.role));
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 flex items-center justify-center" aria-label="Curo home">
        <Logo className="h-10 w-auto" />
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
