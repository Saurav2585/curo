import { createClient } from "@/lib/supabase/server";
import { formatOffer, type Promotion } from "@/lib/promotions";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const supabase = await createClient();
  const { data: promos } = await supabase
    .from("promotions")
    .select("*")
    .order("priority", { ascending: false });

  return (
    <main className="p-8">
      <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">Promotions</h1>
      <p className="text-[0.9375rem] text-[var(--text-muted)]">Campaign catalogue. Creation tools arrive in a later phase.</p>

      <div className="mt-6">
        {promos && promos.length > 0 ? (
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
            <table className="w-full text-[0.875rem]">
              <thead>
                <tr className="bg-[var(--bg-sunken)] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  <th className="px-4 py-2.5 font-medium">Campaign</th>
                  <th className="px-4 py-2.5 font-medium">Offer</th>
                  <th className="px-4 py-2.5 font-medium">Audience</th>
                  <th className="px-4 py-2.5 font-medium">Placement</th>
                  <th className="px-4 py-2.5 font-medium">Priority</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(promos as Promotion[]).map((p) => (
                  <tr key={p.id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-primary)]">{p.title}</p>
                      {p.code && <p className="tabular text-[0.75rem] text-[var(--text-muted)]">{p.code}</p>}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{formatOffer(p)}</td>
                    <td className="px-4 py-3 capitalize text-[var(--text-secondary)]">{p.audience}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{(p.placements ?? []).join(", ")}</td>
                    <td className="tabular px-4 py-3 text-[var(--text-secondary)]">{p.priority}</td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-[var(--radius-full)] px-2 py-0.5 text-[0.6875rem] font-semibold"
                        style={p.active
                          ? { background: "var(--bg-successSubtle)", color: "var(--text-success)" }
                          : { background: "var(--bg-sunken)", color: "var(--text-muted)" }}
                      >
                        {p.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center text-[var(--text-muted)]">
            No promotions yet.
          </p>
        )}
      </div>
    </main>
  );
}
