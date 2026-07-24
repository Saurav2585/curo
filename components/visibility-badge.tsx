import { Star, Sparkles, Circle } from "lucide-react";
import type { VisibilityLevel } from "@/lib/ranking";

const UI: Record<VisibilityLevel, { label: string; bg: string; fg: string; icon: typeof Star }> = {
  standard:  { label: "Standard",  bg: "var(--bg-sunken)",      fg: "var(--text-muted)", icon: Circle },
  featured:  { label: "Featured",  bg: "var(--bg-brandSubtle)", fg: "var(--text-brand)", icon: Star },
  sponsored: { label: "Sponsored", bg: "var(--bg-warnSubtle)",  fg: "var(--text-warn)",  icon: Sparkles },
};

export function VisibilityBadge({ level }: { level: VisibilityLevel }) {
  const s = UI[level] ?? UI.standard;
  const Icon = s.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] px-2.5 py-0.5 text-[0.6875rem] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      <Icon size={11} aria-hidden />
      {s.label}
    </span>
  );
}
