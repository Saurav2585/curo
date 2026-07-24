import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { slotDay } from "@/lib/format";
import {
  approveApplication, rejectApplication, requestMoreInfo, suspendProvider, reactivateProvider,
} from "./actions";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "pending", label: "Pending", statuses: ["draft", "submitted", "pending", "under_review", "info_requested"] },
  { key: "approved", label: "Approved", statuses: ["approved"] },
  { key: "rejected", label: "Rejected", statuses: ["rejected"] },
  { key: "suspended", label: "Suspended", statuses: ["suspended"] },
] as const;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    approved: { bg: "var(--bg-successSubtle)", fg: "var(--text-success)" },
    rejected: { bg: "var(--bg-dangerSubtle)", fg: "var(--text-danger)" },
    suspended: { bg: "var(--bg-dangerSubtle)", fg: "var(--text-danger)" },
    info_requested: { bg: "var(--bg-warnSubtle)", fg: "var(--text-warn)" },
  };
  const s = map[status] ?? { bg: "var(--bg-brandSubtle)", fg: "var(--text-brand)" };
  return (
    <span className="rounded-[var(--radius-full)] px-2 py-0.5 text-[0.6875rem] font-semibold" style={{ background: s.bg, color: s.fg }}>
      {status.replace("_", " ")}
    </span>
  );
}

function ActionButton({ action, id, label, tone }: { action: (fd: FormData) => void; id: string; label: string; tone?: "danger" | "brand" | "neutral" }) {
  const style =
    tone === "danger" ? { color: "var(--text-danger)", borderColor: "var(--border-control)" }
    : tone === "brand" ? { background: "var(--bg-brand)", color: "var(--text-onBrand)", borderColor: "var(--bg-brand)" }
    : { color: "var(--text-secondary)", borderColor: "var(--border-control)" };
  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="rounded-[var(--radius-md)] border px-2.5 py-1 text-[0.75rem] font-medium" style={style}>
        {label}
      </button>
    </form>
  );
}

export default async function AdminProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "pending" } = await searchParams;
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];

  const supabase = await createClient();
  const { data: apps } = await supabase
    .from("provider_applications")
    .select("id, full_name, email, provider_type, specialty, clinic_name, city, status, created_at, review_notes")
    .in("status", active.statuses)
    .order("created_at", { ascending: false });

  return (
    <main className="p-8">
      <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">Providers</h1>
      <p className="text-[0.9375rem] text-[var(--text-muted)]">Review applications and manage provider access.</p>

      <div className="mt-4 flex gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/providers?tab=${t.key}`}
            className="rounded-[var(--radius-full)] border px-3.5 py-1.5 text-[0.8125rem] font-medium"
            style={active.key === t.key
              ? { background: "var(--bg-brand)", borderColor: "var(--bg-brand)", color: "var(--text-onBrand)" }
              : { background: "var(--bg-surface)", borderColor: "var(--border-control)", color: "var(--text-secondary)" }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {apps && apps.length > 0 ? (
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
            <table className="w-full text-[0.875rem]">
              <thead>
                <tr className="bg-[var(--bg-sunken)] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  <th className="px-4 py-2.5 font-medium">Applicant</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Specialty</th>
                  <th className="px-4 py-2.5 font-medium">Applied</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-primary)]">{a.full_name ?? "—"}</p>
                      <p className="text-[0.75rem] text-[var(--text-muted)]">{a.email}</p>
                      <p className="text-[0.75rem] text-[var(--text-muted)]">{a.clinic_name}{a.city ? `, ${a.city}` : ""}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-[var(--text-secondary)]">{a.provider_type}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{a.specialty ?? "—"}</td>
                    <td className="tabular px-4 py-3 text-[var(--text-muted)]">{slotDay(new Date(a.created_at).toISOString())}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {active.key === "pending" && (
                          <>
                            <ActionButton action={approveApplication} id={a.id} label="Approve" tone="brand" />
                            <ActionButton action={requestMoreInfo} id={a.id} label="Request info" />
                            <ActionButton action={rejectApplication} id={a.id} label="Reject" tone="danger" />
                          </>
                        )}
                        {active.key === "approved" && (
                          <ActionButton action={suspendProvider} id={a.id} label="Suspend" tone="danger" />
                        )}
                        {(active.key === "rejected" || active.key === "suspended") && (
                          <ActionButton action={reactivateProvider} id={a.id} label="Reactivate" tone="brand" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center">
            <p className="font-medium text-[var(--text-primary)]">No {active.label.toLowerCase()} applications</p>
            <p className="mt-1 text-[0.875rem] text-[var(--text-muted)]">Nothing to show in this view.</p>
          </div>
        )}
      </div>
    </main>
  );
}
