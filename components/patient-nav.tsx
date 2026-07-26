"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarCheck, Sparkles, Activity, Receipt, Stethoscope } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";

const LINKS = [
  { href: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/account/bookings", label: "My Bookings", icon: CalendarCheck },
  { href: "/account/membership", label: "Membership", icon: Sparkles },
  { href: "/account/activity", label: "Activity", icon: Activity },
  { href: "/account/billing", label: "Billing", icon: Receipt },
];

export function PatientNav({ patientName, bell }: { patientName: string; bell?: ReactNode }) {
  const pathname = usePathname();
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      <div className="mb-6 flex items-center justify-between px-2">
        <Link href="/account" className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)]"
            style={{ background: "var(--bg-brand)" }}
          >
            <CalendarCheck size={18} color="var(--text-onBrand)" aria-hidden />
          </span>
          <span className="text-[1.25rem] font-semibold text-[var(--text-primary)]">Curo</span>
        </Link>
        {bell}
      </div>

      <p className="px-2 text-[0.75rem] uppercase tracking-wide text-[var(--text-muted)]">Your account</p>
      <p className="mb-4 truncate px-2 text-[0.9375rem] font-medium text-[var(--text-primary)]">
        {patientName || "Patient"}
      </p>

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

        <Link
          href="/doctors"
          className="mt-2 flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--border-control)] px-3 py-2 text-[0.9375rem] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-sunken)]"
        >
          <Stethoscope size={17} aria-hidden />
          Find a doctor
        </Link>
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
