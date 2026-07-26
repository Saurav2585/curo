import { redirect } from "next/navigation";
import { Check, Circle, Star, Sparkles } from "lucide-react";
import { getMyDoctor } from "@/lib/doctor";
import { createClient } from "@/lib/supabase/server";
import { getProviderSubscription } from "@/lib/subscription";
import { VisibilityBadge } from "@/components/visibility-badge";
import { computeCompleteness, providerCompletenessItems } from "@/lib/completeness";
import { rankingBreakdown, computeRankingScore, type VisibilityLevel, type SubscriptionTier } from "@/lib/ranking";
import { doctorPhoto } from "@/lib/doctor-photo";

export const dynamic = "force-dynamic";

const BENEFITS: Record<VisibilityLevel, string[]> = {
  standard: ["Listed in search", "Full profile & booking", "0% commission"],
  featured: ["Everything in Standard", "Highlighted in results", "Featured badge", "Higher ranking weight"],
  sponsored: ["Everything in Featured", "Top placement in a specialty", "Sponsored badge (clearly labelled)", "Highest ranking weight"],
};

export default async function VisibilityPage() {
  const doctor = await getMyDoctor();
  if (!doctor) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: full }, { data: application }, { count: availabilityCount }] = await Promise.all([
    supabase.from("doctors").select("visibility_level, sponsored_weight, photo_url, bio, consultation_fee, languages, rating, review_count, is_active").eq("id", doctor.id).maybeSingle(),
    supabase.from("provider_applications").select("registration_number, reg_cert_path, gov_id_path").eq("user_id", user!.id).maybeSingle(),
    supabase.from("availability").select("*", { count: "exact", head: true }).eq("doctor_id", doctor.id),
  ]);

  const sub = await getProviderSubscription(doctor.id, user!.id);
  const level = (full?.visibility_level as VisibilityLevel) ?? "standard";

  const completeness = computeCompleteness(
    providerCompletenessItems({
      hasPhoto: !!full?.photo_url || !!doctorPhoto(doctor.slug),
      hasBio: !!full?.bio,
      hasFee: (full?.consultation_fee ?? 0) > 0,
      hasAddress: !!doctor.clinics?.city,
      hasRegistration: !!application?.registration_number,
      hasDocuments: !!application?.reg_cert_path && !!application?.gov_id_path,
      hasLanguages: (full?.languages ?? []).length > 0,
      hasAvailability: (availabilityCount ?? 0) > 0,
    })
  );

  const factors = {
    visibilityLevel: level,
    verified: !!full?.is_active,
    rating: full?.rating ?? 0,
    reviewCount: full?.review_count ?? 0,
    completeness: completeness.percent,
    subscriptionTier: sub.plan as SubscriptionTier,
    sponsoredWeight: Number(full?.sponsored_weight ?? 0),
  };
  const breakdown = rankingBreakdown(factors);
  const score = computeRankingScore(factors);

  return (
    <main className="p-8">
      <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">Visibility</h1>
      <p className="text-[0.9375rem] text-[var(--text-muted)]">How you appear in search, and what lifts your ranking.</p>

      <div className="mt-6 grid w-full gap-4 lg:grid-cols-2">
        {/* Current visibility + completeness */}
        <div className="ring-hairline rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center justify-between">
            <span className="text-[0.8125rem] text-[var(--text-muted)]">Current visibility</span>
            <VisibilityBadge level={level} />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-[0.875rem]">
              <span className="text-[var(--text-muted)]">Profile completion</span>
              <span className="tabular font-semibold text-[var(--text-primary)]">{completeness.percent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: "var(--bg-sunken)" }}>
              <div className="h-full rounded-full" style={{ width: `${completeness.percent}%`, background: "var(--bg-brand)" }} />
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-1.5">
              {completeness.items.map((it) => (
                <li key={it.label} className="flex items-center gap-1.5 text-[0.8125rem]">
                  {it.done
                    ? <Check size={13} color="var(--text-success)" aria-hidden />
                    : <Circle size={13} color="var(--text-disabled)" aria-hidden />}
                  <span style={{ color: it.done ? "var(--text-secondary)" : "var(--text-muted)" }}>{it.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            disabled
            title="Paid visibility launches with billing"
            className="mt-5 h-10 w-full cursor-not-allowed rounded-[var(--radius-md)] border border-[var(--border-control)] text-[0.875rem] font-medium text-[var(--text-muted)]"
          >
            Boost visibility — coming soon
          </button>
        </div>

        {/* Ranking factors (high level) */}
        <div className="ring-hairline rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center justify-between">
            <span className="text-[0.8125rem] text-[var(--text-muted)]">Ranking factors</span>
            <span className="tabular rounded-[var(--radius-full)] bg-[var(--bg-brandSubtle)] px-2.5 py-0.5 text-[0.6875rem] font-semibold text-[var(--text-brand)]">
              Score {score}
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {breakdown.map((c) => (
              <li key={c.label} className="flex items-center justify-between text-[0.875rem]">
                <span className="text-[var(--text-secondary)]">{c.label}</span>
                <span className="tabular font-medium text-[var(--text-primary)]">+{c.points}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-[var(--border-subtle)] pt-3 text-[0.75rem] text-[var(--text-muted)]">
            Ranking is configurable and does not yet affect the public order. Quality and completeness always matter more than spend.
          </p>
        </div>
      </div>

      {/* Visibility benefits */}
      <section className="mt-8 w-full">
        <h2 className="text-[1.125rem] font-semibold text-[var(--text-primary)]">Visibility levels</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {(["standard", "featured", "sponsored"] as VisibilityLevel[]).map((lv) => {
            const Icon = lv === "sponsored" ? Sparkles : lv === "featured" ? Star : Circle;
            const isCurrent = lv === level;
            return (
              <div
                key={lv}
                className="rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-4"
                style={{ borderColor: isCurrent ? "var(--border-brand)" : "var(--border-subtle)" }}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} color="var(--text-brand)" aria-hidden />
                  <span className="font-medium capitalize text-[var(--text-primary)]">{lv}</span>
                  {isCurrent && <span className="ml-auto text-[0.6875rem] font-semibold text-[var(--text-brand)]">Current</span>}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {BENEFITS[lv].map((b) => (
                    <li key={b} className="flex items-start gap-1.5 text-[0.8125rem]">
                      <Check size={13} color="var(--text-success)" className="mt-0.5 shrink-0" aria-hidden />
                      <span className="text-[var(--text-secondary)]">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
