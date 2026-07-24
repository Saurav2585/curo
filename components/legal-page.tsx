import Link from "next/link";
import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

/**
 * Shared shell for the legal pages so Terms and Privacy stay visually identical.
 * Prose styling is applied here via a scoped class set, using design tokens —
 * no Tailwind typography plugin needed.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="t-eyebrow">Legal</p>
        <h1 className="t-display mt-3">{title}</h1>
        <p className="t-small mt-3">Last updated {updated}</p>

        {/* Honest demo disclaimer */}
        <div
          className="mt-6 flex items-start gap-3 rounded-[var(--radius-lg)] border p-4"
          style={{ borderColor: "var(--border-brand)", background: "var(--bg-brandSubtle)" }}
        >
          <Info size={18} color="var(--text-brand)" className="mt-0.5 shrink-0" aria-hidden />
          <p className="text-[0.875rem] leading-[1.6] text-[var(--text-secondary)]">
            Curo is a demonstration project, not a live commercial service. This
            document is provided as a realistic template and does not constitute a
            binding legal agreement or legal advice. No real appointments, payments,
            or medical services are provided.
          </p>
        </div>

        <div className="legal mt-10">{children}</div>

        <div className="mt-14 border-t border-[var(--border-subtle)] pt-6">
          <Link href="/" className="t-small font-medium text-[var(--text-brand)] hover:underline">
            ← Back to Curo
          </Link>
        </div>
      </main>

      {/* Scoped prose styling from tokens */}
      <style>{`
        .legal h2 {
          font-size: 1.25rem; font-weight: 600; line-height: 1.3;
          color: var(--text-primary); margin-top: 2.5rem; margin-bottom: 0.75rem;
          letter-spacing: -0.01em;
        }
        .legal h2:first-child { margin-top: 0; }
        .legal p { color: var(--text-secondary); line-height: 1.7; margin-bottom: 1rem; }
        .legal ul { margin: 0 0 1rem 0; padding: 0; list-style: none; }
        .legal li {
          color: var(--text-secondary); line-height: 1.7; margin-bottom: 0.5rem;
          padding-left: 1.25rem; position: relative;
        }
        .legal li::before {
          content: ""; position: absolute; left: 0; top: 0.7em;
          width: 5px; height: 5px; border-radius: 9999px; background: var(--text-brand);
        }
        .legal strong { color: var(--text-primary); font-weight: 600; }
        .legal a { color: var(--text-brand); font-weight: 500; }
        .legal a:hover { text-decoration: underline; }
      `}</style>
    </>
  );
}
