import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin-nav";
import { NotificationBell } from "@/components/notification-bell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Admin-only. Non-admins are redirected away; the console is never visible
  // to patients or providers.
  await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <AdminNav bell={<NotificationBell />} />
      <div className="flex-1 bg-[var(--bg-canvas)]">{children}</div>
    </div>
  );
}
