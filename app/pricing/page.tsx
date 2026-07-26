import Link from "next/link";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { PROVIDER_PLANS, ENTERPRISE_PLAN } from "@/lib/plans";

export const metadata = {
  title: "Pricing for clinics — Curo",
  description: "Simple per-clinic plans. Start with a free trial, upgrade when you grow.",
};

/**
 * Clinic-side pricing — Curo is free for patients. Cards are derived from the
 * SAME plan catalogue the app bills against (lib/plans.ts), so the prices shown
 * here always match Billing & Plan and Razorpay checkout. Enterprise is
 * sales-assisted.
 */
type Card = {
  name: string;
  tagline: string;
  price: string;
  period: string;
  cta: string;
  href: string;
  highlighted: boolean;
  benefits: string[];
};

const CARDS: Card[] = [
  ...PROVIDER_PLANS.map((p) => ({
    name: p.name,
    tagline: p.tagline,
    price: p.price,
    period: p.cycle,
    cta: "Start 30-day trial",
    href: "/sign-up",
    highlighted: !!p.highlighted,
    benefits: p.benefits,
  })),
  {
    name: ENTERPRISE_PLAN.name,
    tagline: ENTERPRISE_PLAN.tagline,
    price: "Custom",
    period: "talk to us",
    cta: "Contact sales",
    href: "mailto:enterprise@curo.demo",
    highlighted: false,
    benefits: ENTERPRISE_PLAN.benefits,
  },
];

export default function PricingPage() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 py-14">
        <div className="max-w-2xl">
          <h1 className="text-[3rem] font-bold leading-tight tracking-tight text-[var(--text-primary)]">
            Pricing for clinics
          </h1>
          <p className="mt-3 text-[1.25rem] text-[var(--text-muted)]">
            Curo is always free for patients. Clinics start with a free 30-day
            trial and upgrade when it earns its keep.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {CARDS.map((plan) => {
            const cta = (
              <span
                className="mt-5 flex h-11 items-center justify-center rounded-[var(--radius-md)] font-medium"
                style={
                  plan.highlighted
                    ? { background: "var(--bg-brand)", color: "var(--text-onBrand)" }
                    : {
                        background: "var(--bg-surface)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-control)",
                      }
                }
              >
                {plan.cta}
              </span>
            );
            return (
              <div
                key={plan.name}
                className="relative flex flex-col rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] p-6"
                style={{
                  borderColor: plan.highlighted ? "var(--border-brand)" : "var(--border-subtle)",
                  boxShadow: plan.highlighted ? "var(--shadow-md)" : "var(--shadow-sm)",
                }}
              >
                {plan.highlighted && (
                  <span
                    className="absolute -top-3 left-6 rounded-[var(--radius-full)] px-3 py-1 text-[0.75rem] font-semibold"
                    style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
                  >
                    Most popular
                  </span>
                )}

                <h2 className="text-[1.25rem] font-semibold text-[var(--text-primary)]">
                  {plan.name}
                </h2>
                <p className="mt-1 min-h-[2.5rem] text-[0.875rem] text-[var(--text-muted)]">
                  {plan.tagline}
                </p>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="tabular text-[2rem] font-bold text-[var(--text-primary)]">
                    {plan.price}
                  </span>
                  <span className="text-[0.875rem] text-[var(--text-muted)]">
                    {plan.period}
                  </span>
                </div>

                {plan.href.startsWith("mailto:") ? (
                  <a href={plan.href}>{cta}</a>
                ) : (
                  <Link href={plan.href}>{cta}</Link>
                )}

                <ul className="mt-6 space-y-3">
                  {plan.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-[0.9375rem]">
                      <Check size={17} color="var(--text-success)" className="mt-0.5 shrink-0" aria-hidden />
                      <span className="text-[var(--text-secondary)]">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-[0.875rem] text-[var(--text-muted)]">
          Prices in INR, billed monthly, 0% commission on every booking. Change
          plan or cancel any time from Billing &amp; Plan — no phone call, no
          retention maze.
        </p>
      </main>
    </>
  );
}
