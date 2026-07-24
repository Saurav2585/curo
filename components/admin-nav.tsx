"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Stethoscope, Users, CalendarDays, CreditCard,
  Receipt, Tag, Megaphone, LifeBuoy, Settings, ShieldCheck,
} from "lucide-react";
import { signOut } from "@/app/(auth)/actions";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/providers", label: "Providers", icon: Stethoscope },
  { href: "/admin/patients", label: "Patients", icon: Users },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/billing", label: "Billing", icon: Receipt },
  { href: "/admin/promotions", label: "Promotions", icon: Tag },
  { href: "/admin/sponsored", label: "Sponsored Listings", icon: Megaphone },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      <Link href="/admin" className="mb-6 flex items-center gap-2 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)]" style={{ background: "var(--bg-inverse)" }}>
          <ShieldCheck size={18} color="var(--text-onInverse)" aria-hidden />
        </span>
        <span className="text-[1.25rem] font-semibold text-[var(--text-primary)]">Curo</span>
        <span className="rounded-[var(--radius-full)] bg-[var(--bg-sunken)] px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Admin
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {LINKS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "flex items-center gap-2.5 rounded-[var(--radius-md)] bg-[var(--bg-brandSubtle)] px-3 py-2 text-[0.9375rem] font-medium text-[var(--text-brand)]"
                  : "flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-[0.9375rem] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
              }
            >
              <Icon size={17} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <form action={signOut}>
        <button type="submit" className="w-full rounded-[var(--radius-md)] px-3 py-2 text-left text-[0.875rem] text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          Sign out
        </button>
      </form>
    </aside>
  );
}
