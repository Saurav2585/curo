import Link from "next/link";
import { LayoutDashboard, CalendarDays, Clock, CalendarCheck } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/dashboard/schedule", label: "Schedule", icon: Clock },
];

export function DoctorNav({ doctorName }: { doctorName: string }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      <Link href="/" className="mb-6 flex items-center gap-2 px-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)]"
          style={{ background: "var(--bg-brand)" }}
        >
          <CalendarCheck size={18} color="var(--text-onBrand)" aria-hidden />
        </span>
        <span className="text-[1.25rem] font-semibold text-[var(--text-primary)]">Curo</span>
      </Link>

      <p className="px-2 text-[0.75rem] uppercase tracking-wide text-[var(--text-muted)]">
        Doctor portal
      </p>
      <p className="mb-4 px-2 text-[0.9375rem] font-medium text-[var(--text-primary)]">
        {doctorName}
      </p>

      <nav className="flex flex-1 flex-col gap-1">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-[0.9375rem] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-brandSubtle)] hover:text-[var(--text-brand)]"
          >
            <Icon size={17} aria-hidden />
            {label}
          </Link>
        ))}
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
