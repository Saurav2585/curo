import Link from "next/link";
import type { ComponentType } from "react";
import {
  Users, Stethoscope, ClipboardList, BadgeCheck, CreditCard, IndianRupee, Tag, LifeBuoy,
} from "lucide-react";
import { getAdminStats } from "@/lib/admin";

export const dynamic = "force-dynamic";

function StatCard({
  label, value, sub, icon: Icon, href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  href?: string;
}) {
  const inner = (
    <div className="ring-hairline lift h-full rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-center justify-between">
        <span className="text-[0.8125rem] text-[var(--text-muted)]">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--bg-brandSubtle)" }}>
          <Icon size={16} color="var(--text-brand)" />
        </span>
      </div>
      <p className="tabular mt-3 text-[1.75rem] font-bold leading-none text-[var(--text-primary)]">{value}</p>
      {sub && <p className="mt-1 text-[0.8125rem] text-[var(--text-muted)]">{sub}</p>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}

export default async function AdminDashboard() {
  const s = await getAdminStats();

  return (
    <main className="p-8">
      <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">Overview</h1>
      <p className="text-[0.9375rem] text-[var(--text-muted)]">Operational snapshot of the platform.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total patients" value={s.patients} icon={Users} href="/admin/patients" />
        <StatCard label="Total providers" value={s.providers} icon={Stethoscope} href="/admin/providers" />
        <StatCard label="Pending applications" value={s.pendingApplications} sub="awaiting review" icon={ClipboardList} href="/admin/providers" />
        <StatCard label="Active memberships" value={s.activeMemberships} icon={BadgeCheck} href="/admin/subscriptions" />
        <StatCard label="Provider subscriptions" value={s.activeProviderSubs} icon={CreditCard} href="/admin/subscriptions" />
        <StatCard label="Revenue" value={s.revenue} sub="available with billing" icon={IndianRupee} />
        <StatCard label="Active promotions" value={s.activePromotions} icon={Tag} href="/admin/promotions" />
        <StatCard label="Pending support" value={s.pendingSupport} sub="placeholder" icon={LifeBuoy} href="/admin/support" />
      </div>
    </main>
  );
}
