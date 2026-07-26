import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listUserActivity } from "@/lib/audit";
import { AuditTimeline } from "@/components/audit-timeline";

export const dynamic = "force-dynamic";

/**
 * Patient activity — a read-only account history: bookings, reviews, membership,
 * and account changes. Reads the shared audit log; it never writes.
 */
export default async function PatientActivityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/account/activity");

  const entries = await listUserActivity(user.id);

  return (
    <main className="p-8">
      <h1 className="t-h1">Activity</h1>
      <p className="mt-1 text-[var(--text-muted)]">
        Your account history — bookings, reviews, membership, and account changes.
      </p>

      <div className="mt-8 max-w-3xl">
        <AuditTimeline entries={entries} emptyText="No account activity yet. Your bookings and updates will appear here." />
      </div>
    </main>
  );
}
