import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Pricing for clinics — Curo",
  description: "Simple per-clinic plans. Start free, upgrade when you grow.",
};

/**
 * A pricing page for the *clinic* side — Curo is free for patients. Follows the
 * deck's rules: three tiers, a highlighted middle, plans named for who they're
 * for, features led by outcome, an honest annual note, and an easy downgrade path.
 */
const PLANS = [
  {
    name: "Solo",
    tagline: "For a single practitioner finding their feet online",
    price: "Free",
    period: "forever",
    cta: "Start free",
    highlighted: false,
    features: [
      { label: "1 doctor profile", included: true },
      { label: "Online slot booking", included: true },
      { label: "Patient booking history", included: true },
      { label: "Email confirmations", included: true },
      { label: "Booking analytics", included: false },
      { label: "Multiple clinic locations", included: false },
      { label: "Priority support", included: false },
    ],
  },
  {
    name: "Practice",
    tagline: "For a growing clinic with a handful of doctors",
    price: "₹1,499",
    period: "per month",
    cta: "Start 14-day trial",
    highlighted: true,
    features: [
      { label: "Up to 10 doctor profiles", included: true },
      { label: "Online slot booking", included: true },
      { label: "Patient booking history", included: true },
      { label: "Email + SMS confirmations", included: true },
      { label: "Booking analytics dashboard", included: true },
      { label: "Multiple clinic locations", included: false },
      { label: "Priority support", included: false },
    ],
  },
  {
    name: "Hospital",
    tagline: "For multi-location hospitals and chains",
    price: "Custom",
    period: "talk to us",
    cta: "Contact sales",
    highlighted: false,
    features: [
      { label: "Unlimited doctor profiles", included: true },
      { label: "Online slot booking", included: true },
      { label: "Patient booking history", included: true },
      { label: "Email + SMS confirmations", included: true },
      { label: "Booking analytics dashboard", included: true },
      { label: "Multiple clinic locations", included: true },
      { label: "Priority support & onboarding", included: true },
    ],
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
            Curo is always free for patients. Clinics pay only as they grow —
            start free, upgrade when it earns its keep.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
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

              <Link
                href="/sign-up"
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
              </Link>

              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-2.5 text-[0.9375rem]">
                    {f.included ? (
                      <Check size={17} color="var(--text-success)" className="mt-0.5 shrink-0" aria-hidden />
                    ) : (
                      <Minus size={17} color="var(--text-disabled)" className="mt-0.5 shrink-0" aria-hidden />
                    )}
                    <span
                      style={{
                        color: f.included ? "var(--text-secondary)" : "var(--text-disabled)",
                      }}
                    >
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-[0.875rem] text-[var(--text-muted)]">
          Prices in INR, billed monthly. Save 20% on annual billing. Change plan
          or cancel any time from clinic settings — no phone call, no retention maze.
        </p>
      </main>
    </>
  );
}
