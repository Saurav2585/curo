import { redirect } from "next/navigation";
import { getMyDoctor } from "@/lib/doctor";
import { createClient } from "@/lib/supabase/server";
import { listUserActivity } from "@/lib/audit";
import { AuditTimeline } from "@/components/audit-timeline";

export const dynamic = "force-dynamic";

/**
 * Provider activity — a lightweight, read-only view of practice history
 * (profile, schedule, subscription, and visibility changes). Reads the shared
 * audit log; it never writes.
 */
export default async function ProviderActivityPage() {
  const doctor = await getMyDoctor();
  if (!doctor) redirect("/dashboard");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const entries = user ? await listUserActivity(user.id) : [];

  return (
    <main className="p-8">
      <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">Activity</h1>
      <p className="text-[0.9375rem] text-[var(--text-muted)]">
        Your practice history — profile, schedule, subscription, and visibility changes. Read-only.
      </p>

      <div className="mt-6 w-full">
        <AuditTimeline entries={entries} emptyText="No recent activity yet. Changes to your practice will appear here." />
      </div>
    </main>
  );
}
