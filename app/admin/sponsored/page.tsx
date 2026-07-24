import { createClient } from "@/lib/supabase/server";
import { VisibilityBadge } from "@/components/visibility-badge";
import {
  computeRankingScore, type VisibilityLevel, type SubscriptionTier,
} from "@/lib/ranking";
import { setVisibility } from "./actions";

export const dynamic = "force-dynamic";

function SetButton({ id, level, label }: { id: string; level: VisibilityLevel; label: string }) {
  return (
    <form action={setVisibility} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="level" value={level} />
      <button
        type="submit"
        className="rounded-[var(--radius-md)] border border-[var(--border-control)] px-2.5 py-1 text-[0.75rem] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        {label}
      </button>
    </form>
  );
}

export default async function AdminSponsoredPage() {
  const supabase = await createClient();
  const { data: doctors } = await supabase
    .from("doctors")
    .select("id, full_name, visibility_level, sponsored_weight, rating, review_count, plan, is_active")
    .order("full_name")
    .limit(300);

  // Ranking overview: compute the configurable score for each provider.
  const rows = (doctors ?? []).map((d) => {
    const level = (d.visibility_level as VisibilityLevel) ?? "standard";
    const score = computeRankingScore({
      visibilityLevel: level,
      verified: !!d.is_active,
      rating: d.rating ?? 0,
      reviewCount: d.review_count ?? 0,
      completeness: 70, // admin list uses a nominal completeness; full detail lives on the provider's page
      subscriptionTier: (d.plan as SubscriptionTier) ?? "trial",
      sponsoredWeight: Number(d.sponsored_weight ?? 0),
    });
    return { ...d, level, score };
  });
  rows.sort((a, b) => b.score - a.score);

  const featured = rows.filter((r) => r.level === "featured").length;
  const sponsored = rows.filter((r) => r.level === "sponsored").length;

  return (
    <main className="p-8">
      <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">Sponsored Listings</h1>
      <p className="text-[0.9375rem] text-[var(--text-muted)]">
        Manage provider visibility and review the ranking overview. Visibility is display-only until billing.
      </p>

      <div className="mt-4 flex gap-6 text-[0.875rem]">
        <span className="text-[var(--text-muted)]">Featured: <span className="tabular font-semibold text-[var(--text-primary)]">{featured}</span></span>
        <span className="text-[var(--text-muted)]">Sponsored: <span className="tabular font-semibold text-[var(--text-primary)]">{sponsored}</span></span>
        <span className="text-[var(--text-muted)]">Total: <span className="tabular font-semibold text-[var(--text-primary)]">{rows.length}</span></span>
      </div>

      <div className="mt-6 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
        <table className="w-full text-[0.875rem]">
          <thead>
            <tr className="bg-[var(--bg-sunken)] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[var(--text-muted)]">
              <th className="px-4 py-2.5 font-medium">Provider</th>
              <th className="px-4 py-2.5 font-medium">Visibility</th>
              <th className="px-4 py-2.5 text-right font-medium">Rating</th>
              <th className="px-4 py-2.5 text-right font-medium">Score</th>
              <th className="px-4 py-2.5 font-medium">Set visibility</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{d.full_name}</td>
                <td className="px-4 py-3"><VisibilityBadge level={d.level} /></td>
                <td className="tabular px-4 py-3 text-right text-[var(--text-secondary)]">{d.rating ?? "—"}</td>
                <td className="tabular px-4 py-3 text-right font-semibold text-[var(--text-primary)]">{d.score}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <SetButton id={d.id} level="standard" label="Standard" />
                    <SetButton id={d.id} level="featured" label="Feature" />
                    <SetButton id={d.id} level="sponsored" label="Sponsor" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
