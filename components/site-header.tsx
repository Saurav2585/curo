import Link from "next/link";
import { getSessionRole } from "@/lib/roles";
import { signOut } from "@/app/(auth)/actions";
import { NotificationBell } from "@/components/notification-bell";
import { Logo } from "@/components/brand";

export async function SiteHeader() {
  const session = await getSessionRole();
  const isDoctor = session?.role === "doctor";

  return (
    <header className="glass sticky top-0 z-40 border-b border-[var(--border-subtle)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center" aria-label="Curo home">
          <Logo className="h-9 w-auto" />
        </Link>

        <nav className="flex items-center gap-6 text-[0.9375rem]">
          <Link
            href="/doctors"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Find a doctor
          </Link>
          <Link
            href="/pricing"
            className="hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] sm:block"
          >
            For clinics
          </Link>

          {session ? (
            <>
              <Link
                href={isDoctor ? "/dashboard" : "/account"}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Dashboard
              </Link>
              <NotificationBell />
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-[var(--radius-md)] border border-[var(--border-control)] px-4 py-2 text-[var(--text-primary)] hover:bg-[var(--bg-sunken)]"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-[var(--radius-md)] border border-[var(--border-control)] px-4 py-2 text-[var(--text-primary)] hover:bg-[var(--bg-sunken)]"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
