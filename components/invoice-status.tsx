import type { InvoiceStatus } from "@/lib/billing";

const UI: Record<InvoiceStatus, { label: string; bg: string; fg: string }> = {
  draft:   { label: "Draft",   bg: "var(--bg-sunken)",        fg: "var(--text-muted)" },
  issued:  { label: "Issued",  bg: "var(--bg-brandSubtle)",   fg: "var(--text-brand)" },
  paid:    { label: "Paid",    bg: "var(--bg-successSubtle)", fg: "var(--text-success)" },
  void:    { label: "Void",    bg: "var(--bg-sunken)",        fg: "var(--text-muted)" },
  overdue: { label: "Overdue", bg: "var(--bg-dangerSubtle)",  fg: "var(--text-danger)" },
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const s = UI[status] ?? UI.draft;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] px-2.5 py-0.5 text-[0.6875rem] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} aria-hidden />
      {s.label}
    </span>
  );
}
