import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="glass sticky top-0 z-40 border-b border-[var(--border-subtle)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)]"
            style={{ background: "var(--bg-brand)" }}
          >
            <CalendarCheck size={18} color="var(--text-onBrand)" aria-hidden />
          </span>
          <span className="text-[1.25rem] font-semibold tracking-tight text-[var(--text-primary)]">
            Curo
          </span>
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

          {user ? (
            <>
              <Link
                href="/bookings"
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                My bookings
              </Link>
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
