import { listAudit, auditMeta, AUDIT_EVENT_TYPES, type AuditEventType } from "@/lib/audit";
import { AuditOutcomeBadge, auditTimestamp } from "@/components/audit-timeline";

export const dynamic = "force-dynamic";

/**
 * Admin audit — READ ONLY. The full platform history with filtering, searching,
 * a date range, event-type and actor filters. No editing, no deletion: the table
 * is append-only at the database and there are no mutation controls here.
 */
export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; actor?: string; from?: string; to?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const eventType = AUDIT_EVENT_TYPES.includes(sp.type as AuditEventType) ? (sp.type as AuditEventType) : undefined;

  const entries = await listAudit({
    eventType,
    actor: sp.actor || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
    search: sp.q || undefined,
  });

  const field = "rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3 py-2 text-[0.875rem] text-[var(--text-primary)]";

  return (
    <main className="p-8">
      <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text-primary)]">Audit log</h1>
      <p className="text-[0.9375rem] text-[var(--text-muted)]">
        Immutable platform history. Read-only — entries cannot be edited or deleted.
      </p>

      {/* Filters (GET form so filters are shareable URLs) */}
      <form className="mt-6 flex flex-wrap items-end gap-3">
        <label className="text-[0.75rem] font-medium text-[var(--text-muted)]">
          <span className="mb-1 block">Event type</span>
          <select name="type" defaultValue={eventType ?? ""} className={field}>
            <option value="">All events</option>
            {AUDIT_EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{auditMeta(t).label}</option>
            ))}
          </select>
        </label>
        <label className="text-[0.75rem] font-medium text-[var(--text-muted)]">
          <span className="mb-1 block">Actor</span>
          <input name="actor" defaultValue={sp.actor ?? ""} placeholder="Name" className={field} />
        </label>
        <label className="text-[0.75rem] font-medium text-[var(--text-muted)]">
          <span className="mb-1 block">From</span>
          <input type="date" name="from" defaultValue={sp.from ?? ""} className={field} />
        </label>
        <label className="text-[0.75rem] font-medium text-[var(--text-muted)]">
          <span className="mb-1 block">To</span>
          <input type="date" name="to" defaultValue={sp.to ?? ""} className={field} />
        </label>
        <label className="text-[0.75rem] font-medium text-[var(--text-muted)]">
          <span className="mb-1 block">Search</span>
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Actor or target" className={field} />
        </label>
        <button type="submit" className="rounded-[var(--radius-md)] px-4 py-2 text-[0.875rem] font-medium" style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}>
          Filter
        </button>
        <a href="/admin/audit" className="rounded-[var(--radius-md)] border border-[var(--border-control)] px-4 py-2 text-[0.875rem] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)]">
          Reset
        </a>
      </form>

      <p className="mt-4 text-[0.8125rem] text-[var(--text-muted)]">
        <span className="tabular font-semibold text-[var(--text-primary)]">{entries.length}</span> entries
      </p>

      <div className="mt-2 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)]">
        <table className="w-full text-[0.875rem]">
          <thead>
            <tr className="bg-[var(--bg-sunken)] text-left text-[0.6875rem] uppercase tracking-[0.06em] text-[var(--text-muted)]">
              <th className="px-4 py-2.5 font-medium">Time</th>
              <th className="px-4 py-2.5 font-medium">Event</th>
              <th className="px-4 py-2.5 font-medium">Actor</th>
              <th className="px-4 py-2.5 font-medium">Target</th>
              <th className="px-4 py-2.5 font-medium">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="bg-[var(--bg-surface)] px-4 py-10 text-center text-[var(--text-muted)]">
                  No audit entries match these filters.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] align-top">
                  <td className="tabular whitespace-nowrap px-4 py-3 text-[var(--text-muted)]">{auditTimestamp(e.created_at)}</td>
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{auditMeta(e.event_type).label}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{e.actor_label ?? "System"}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{e.target_label ?? "—"}</td>
                  <td className="px-4 py-3"><AuditOutcomeBadge success={e.success} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
