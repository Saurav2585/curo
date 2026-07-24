import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionRole } from "@/lib/roles";

/** Gate every admin surface. Non-admins never reach the console. */
export async function requireAdmin() {
  const session = await getSessionRole();
  if (!session) redirect("/sign-in?next=/admin");
  if (session.role !== "admin") redirect("/");
  return session;
}

/** Overview counts for the admin dashboard. Revenue and support are placeholders. */
export async function getAdminStats() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const count = async (table: string, build?: (q: any) => any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase.from(table).select("*", { count: "exact", head: true });
    if (build) q = build(q);
    const { count: c } = await q;
    return c ?? 0;
  };

  const [
    patients,
    providers,
    pendingApplications,
    activeMemberships,
    activeProviderSubs,
    activePromotions,
  ] = await Promise.all([
    count("profiles", (q) => q.eq("role", "patient")),
    count("doctors"),
    count("provider_applications", (q) =>
      q.in("status", ["draft", "submitted", "pending", "under_review", "info_requested"])
    ),
    count("profiles", (q) => q.neq("membership_plan", "free")),
    count("doctors", (q) => q.in("plan", ["pro", "clinic", "enterprise"])),
    count("promotions", (q) => q.eq("active", true)),
  ]);

  return {
    patients,
    providers,
    pendingApplications,
    activeMemberships,
    activeProviderSubs,
    activePromotions,
    revenue: "—", // placeholder until billing runs
    pendingSupport: 0, // placeholder
  };
}
