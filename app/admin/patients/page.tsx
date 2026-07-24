import { createClient } from "@/lib/supabase/server";
import { normalizePatientPlan, planName } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export default async function AdminPatientsPage() {
  const supabase = await createClient();
  const { data: patients } = await supabase
    .from("profiles")
    .select("id, full_name, phone, membership_plan, created_at")
    .eq("role", "patient")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <main className="p-8">
      <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">Patients</h1>
      <p className="text-[0.9375rem] text-[var(--text-muted)]">
        Membership and status. Medical information is never editable here.
      </p>

      <div className="mt-6">
        {patients && patients.length > 0 ? (
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
            <table className="w-full text-[0.875rem]">
              <thead>
                <tr className="bg-[var(--bg-sunken)] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Phone</th>
                  <th className="px-4 py-2.5 font-medium">Plan</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => {
                  const plan = normalizePatientPlan(p.membership_plan);
                  return (
                    <tr key={p.id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{p.full_name || "—"}</td>
                      <td className="tabular px-4 py-3 text-[var(--text-muted)]">{p.phone || "—"}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{planName(plan)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-[var(--radius-full)] px-2 py-0.5 text-[0.6875rem] font-semibold" style={{ background: "var(--bg-successSubtle)", color: "var(--text-success)" }}>
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center text-[var(--text-muted)]">
            No patients yet.
          </p>
        )}
      </div>
    </main>
  );
}
