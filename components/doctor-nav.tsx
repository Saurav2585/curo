"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Clock, CreditCard, TrendingUp, Star, CalendarRange, Activity } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { LogoMark } from "@/components/brand";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/dashboard/schedule", label: "Schedule", icon: Clock },
  { href: "/dashboard/availability", label: "Availability", icon: CalendarRange },
  { href: "/dashboard/reputation", label: "Reputation", icon: Star },
  { href: "/dashboard/visibility", label: "Visibility", icon: TrendingUp },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/billing", label: "Billing & Plan", icon: CreditCard },
];

export function DoctorNav({ doctorName, bell }: { doctorName: string; bell?: ReactNode }) {
  const pathname = usePathname();
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      <div className="mb-6 flex items-center justify-between px-2">
        <Link href="/dashboard" className="flex items-center gap-2" aria-label="Curo">
          <LogoMark className="h-8 w-auto" />
          <span className="text-[1.25rem] font-semibold text-[var(--text-primary)]">Curo</span>
        </Link>
        {bell}
      </div>

      <p className="px-2 text-[0.75rem] uppercase tracking-wide text-[var(--text-muted)]">
        Doctor portal
      </p>
      <p className="mb-4 px-2 text-[0.9375rem] font-medium text-[var(--text-primary)]">
        {doctorName}
      </p>

      <nav className="flex flex-1 flex-col gap-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
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
        <button
          type="submit"
          className="w-full rounded-[var(--radius-md)] px-3 py-2 text-left text-[0.875rem] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          Sign out
        </button>
      </form>
    </aside>
  );
}
