import { createClient } from "@/lib/supabase/server";
import { planName, normalizeProviderPlan } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();
  const [{ data: doctors }, { data: patients }] = await Promise.all([
    supabase.from("doctors").select("id, full_name, plan, is_active").order("full_name").limit(200),
    supabase.from("profiles").select("id, full_name, membership_plan").eq("role", "patient").neq("membership_plan", "free").limit(200),
  ]);

  return (
    <main className="p-8">
      <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">Subscriptions</h1>
      <p className="text-[0.9375rem] text-[var(--text-muted)]">Patient memberships, doctor, clinic and enterprise plans.</p>

      <section className="mt-6">
        <h2 className="mb-3 text-[1.125rem] font-semibold text-[var(--text-primary)]">Provider subscriptions</h2>
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
          <table className="w-full text-[0.875rem]">
            <thead>
              <tr className="bg-[var(--bg-sunken)] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[var(--text-muted)]">
                <th className="px-4 py-2.5 font-medium">Provider</th>
                <th className="px-4 py-2.5 font-medium">Plan</th>
                <th className="px-4 py-2.5 font-medium">Listing</th>
              </tr>
            </thead>
            <tbody>
              {(doctors ?? []).map((d) => (
                <tr key={d.id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{d.full_name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{d.plan === "trial" ? "Trial" : planName(normalizeProviderPlan(d.plan))}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{d.is_active ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[1.125rem] font-semibold text-[var(--text-primary)]">Patient memberships</h2>
        {patients && patients.length > 0 ? (
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
            <table className="w-full text-[0.875rem]">
              <thead>
                <tr className="bg-[var(--bg-sunken)] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  <th className="px-4 py-2.5 font-medium">Patient</th>
                  <th className="px-4 py-2.5 font-medium">Plan</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{p.full_name || "—"}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">Care+</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center text-[var(--text-muted)]">
            No paid memberships yet — all patients are on the Free plan.
          </p>
        )}
      </section>
    </main>
  );
}
