import Link from "next/link";
import type { ComponentType } from "react";
import {
  Stethoscope, Sparkles, HeartPulse, Baby, Bone, Brain,
  Search, CalendarCheck, MousePointerClick, ArrowRight, ArrowUpRight,
  Eye, LockKeyhole, Zap, ShieldCheck, CreditCard, EyeOff, BadgeCheck,
  Building2, TrendingUp, Users, Wallet, Quote, Star, Activity, HeartHandshake, ClipboardCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { HeroMockup } from "@/components/hero-mockup";
import { Reveal } from "@/components/reveal";
import { PromotionSlot } from "@/components/promotion-slot";
import { Logo } from "@/components/brand";
import { PATIENT_PLANS } from "@/lib/plans";
import type { Specialty } from "@/lib/types";

export const dynamic = "force-dynamic";

const ICONS: Record<string, ComponentType<{ size?: number; color?: string; className?: string }>> = {
  stethoscope: Stethoscope, sparkles: Sparkles, "heart-pulse": HeartPulse,
  baby: Baby, bone: Bone, brain: Brain,
};

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: specialties }, { count: doctorCount }] = await Promise.all([
    supabase.from("specialties").select("*").order("name"),
    supabase.from("doctors").select("*", { count: "exact", head: true }),
  ]);

  const specList = (specialties as Specialty[] | null) ?? [];
  const docN = doctorCount ?? 12;

  return (
    <>
      <SiteHeader />

      <main>
        {/* ================================================= HERO */}
        <section className="relative overflow-hidden">
          {/* Layered ambient background — soft brand wash + floating shapes */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full opacity-[0.14] blur-3xl float-slow"
              style={{ background: "radial-gradient(circle, var(--color-teal-400), transparent 70%)" }}
            />
            <div
              className="absolute right-[-6rem] top-24 h-[22rem] w-[22rem] rounded-full opacity-[0.10] blur-3xl"
              style={{ background: "radial-gradient(circle, var(--color-teal-300), transparent 70%)" }}
            />
            <div className="absolute inset-x-0 top-0 h-px bg-[var(--border-subtle)]" />
          </div>

          <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
            <div>
              <span className="ring-hairline inline-flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--bg-surface)] px-3 py-1 text-[0.8125rem] font-medium text-[var(--text-secondary)]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--text-success)" }} aria-hidden />
                Real-time availability
              </span>
              <h1 className="t-display mt-5 max-w-xl">Book a real doctor in under a minute.</h1>
              <p className="t-lead mt-5 max-w-md">
                See a doctor&apos;s whole day like a seat map, pick an open slot, and get a
                confirmed appointment. No callbacks, no hold music.
              </p>

              {/* Search — presented as a primary feature */}
              <Link
                href="/doctors"
                className="card card-hover mt-8 flex items-center gap-3 p-2.5 pl-4"
                aria-label="Search doctors and specialties"
              >
                <Search size={18} color="var(--text-muted)" aria-hidden />
                <span className="flex-1 text-[0.9375rem] text-[var(--text-muted)]">
                  Search doctors, specialties, clinics…
                </span>
                <span
                  className="flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] px-4 text-[0.875rem] font-medium text-[var(--text-onBrand)]"
                  style={{ background: "var(--bg-brand)" }}
                >
                  Search <ArrowRight size={15} aria-hidden />
                </span>
              </Link>

              {/* Specialty quick chips (real data) */}
              <div className="mt-4 flex flex-wrap gap-2">
                {specList.slice(0, 5).map((s) => (
                  <Link
                    key={s.id}
                    href={`/doctors?specialty=${s.slug}`}
                    className="ring-hairline rounded-[var(--radius-full)] bg-[var(--bg-surface)] px-3 py-1.5 text-[0.8125rem] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/doctors"
                  className="flex h-11 items-center gap-2 rounded-[var(--radius-md)] px-5 text-[0.9375rem] font-medium text-[var(--text-onBrand)] shadow-[var(--shadow-sm)]"
                  style={{ background: "var(--bg-brand)" }}
                >
                  Find a doctor <ArrowRight size={16} aria-hidden />
                </Link>
                <Link
                  href="/pricing"
                  className="flex h-11 items-center rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-5 text-[0.9375rem] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-sunken)]"
                >
                  For clinics
                </Link>
              </div>
            </div>

            <Reveal delay={100} className="lg:pl-4">
              <HeroMockup />
            </Reveal>
          </div>
        </section>

        {/* Promotion slot — patient offers only */}
        <div className="mx-auto max-w-6xl px-6">
          <PromotionSlot placement="landing" />
        </div>

        {/* ================================================= TRUST STRIP */}
        <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-sunken)]">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <Reveal>
              <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { n: `${docN}+`, l: "Verified doctors" },
                  { n: `${specList.length || 6}`, l: "Specialties" },
                  { n: "50k+", l: "Appointments booked" },
                  { n: "4.8★", l: "Patient rating" },
                  { n: "24/7", l: "Instant booking" },
                ].map((m) => (
                  <div key={m.l} className="text-center">
                    <p className="tabular text-[1.875rem] font-bold leading-none tracking-[-0.02em] text-[var(--text-primary)]">
                      {m.n}
                    </p>
                    <p className="t-small mt-1.5">{m.l}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================================================= WHY CURO (folded problem + features) */}
        <section className="border-t border-[var(--border-subtle)]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="t-eyebrow">Why Curo</p>
                <h2 className="t-h1 mt-3">A confirmation that&apos;s actually confirmed</h2>
                <p className="t-body mt-4">
                  Most sites hold a stale copy of the calendar, so bookings bounce and times go
                  wrong. Curo computes every slot live from the doctor&apos;s own schedule and writes
                  your booking straight to the source.
                </p>
              </div>
            </Reveal>

            <div className="mt-14 grid gap-5 sm:grid-cols-3">
              {[
                { icon: Eye, title: "See real availability", body: "A doctor's day as a seat map — available, filling fast, or taken, at a glance. Read the week and commit in one tap." },
                { icon: LockKeyhole, title: "No double-bookings", body: "Two patients can't take the same slot. It's guaranteed at the database, not hoped for in code." },
                { icon: Zap, title: "Under 60 seconds", body: "Search, pick, confirm. Sign-in waits until the slot is chosen, so nothing slows the path to booked." },
              ].map((f, i) => (
                <Reveal key={f.title} delay={i * 70}>
                  <div className="card card-hover h-full p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)]" style={{ background: "var(--bg-brandSubtle)" }}>
                      <f.icon size={20} color="var(--text-brand)" aria-hidden />
                    </span>
                    <h3 className="t-h3 mt-4">{f.title}</h3>
                    <p className="t-small mt-2 leading-[1.6]">{f.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================= SPECIALTIES */}
        <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-sunken)]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <Reveal>
              <div className="flex items-end justify-between">
                <div>
                  <p className="t-eyebrow">Care for every concern</p>
                  <h2 className="t-h1 mt-3">Browse by specialty</h2>
                </div>
                <Link href="/doctors" className="t-small hidden shrink-0 items-center gap-1.5 font-medium text-[var(--text-brand)] hover:underline sm:inline-flex">
                  All doctors <ArrowRight size={15} aria-hidden />
                </Link>
              </div>
            </Reveal>

            <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {specList.map((s, i) => {
                const Icon = ICONS[s.icon] ?? Stethoscope;
                return (
                  <Reveal key={s.id} delay={(i % 3) * 60}>
                    <Link
                      href={`/doctors?specialty=${s.slug}`}
                      className="card card-hover group flex h-full items-start gap-4 p-5"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)]" style={{ background: "var(--bg-brandSubtle)" }}>
                        <Icon size={20} color="var(--text-brand)" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between font-medium text-[var(--text-primary)]">
                          {s.name}
                          <ArrowUpRight size={16} className="text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                        </span>
                        <span className="t-small mt-1 block leading-[1.5]">{s.description}</span>
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ================================================= HEALTHCARE JOURNEY */}
        <section className="border-t border-[var(--border-subtle)]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="t-eyebrow">The care journey</p>
                <h2 className="t-h1 mt-3">From search to recovery, in one place</h2>
              </div>
            </Reveal>
            <div className="relative mt-14">
              <div aria-hidden className="absolute left-0 right-0 top-[22px] hidden h-px bg-[var(--border-subtle)] lg:block" />
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { icon: Search, title: "Search", body: "By specialty, city or name — fees and ratings upfront." },
                  { icon: MousePointerClick, title: "Book", body: "Pick an open slot from the live seat map." },
                  { icon: CalendarCheck, title: "Visit", body: "A confirmed time with a reference and calendar add." },
                  { icon: ClipboardCheck, title: "Follow-up", body: "Providers can recommend a follow-up after your visit." },
                  { icon: HeartHandshake, title: "Recovery", body: "Your history and reviews stay in one care record." },
                ].map((step, i) => (
                  <Reveal key={step.title} delay={i * 60}>
                    <div className="relative">
                      <span
                        className="ring-hairline relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-surface)]"
                      >
                        <step.icon size={19} color="var(--text-brand)" aria-hidden />
                      </span>
                      <h3 className="mt-4 font-semibold text-[var(--text-primary)]">
                        <span className="tabular text-[var(--text-brand)]">0{i + 1}</span> · {step.title}
                      </h3>
                      <p className="t-small mt-1.5 leading-[1.6]">{step.body}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================= FOR DOCTORS */}
        <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-sunken)]">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
            <Reveal>
              <div>
                <p className="t-eyebrow">For doctors</p>
                <h2 className="t-h1 mt-3">Fill your calendar, keep your fee</h2>
                <p className="t-body mt-4 max-w-md">
                  Publish real availability, cut no-shows with clear confirmations, and grow your
                  practice — with zero commission on every booking.
                </p>
                <Link
                  href="/apply"
                  className="mt-7 inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] px-5 text-[0.9375rem] font-medium text-[var(--text-onBrand)] shadow-[var(--shadow-sm)]"
                  style={{ background: "var(--bg-brand)" }}
                >
                  Apply to join <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Wallet, title: "0% commission", body: "Every booking, every fee — yours." },
                { icon: Activity, title: "Booking analytics", body: "See utilisation and trends at a glance." },
                { icon: BadgeCheck, title: "Verified profile", body: "A trusted, searchable presence." },
                { icon: TrendingUp, title: "Reputation", body: "Verified-visit reviews build your standing." },
              ].map((c) => (
                <div key={c.title} className="card card-hover p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]" style={{ background: "var(--bg-brandSubtle)" }}>
                    <c.icon size={18} color="var(--text-brand)" aria-hidden />
                  </span>
                  <h3 className="mt-3 font-semibold text-[var(--text-primary)]">{c.title}</h3>
                  <p className="t-small mt-1 leading-[1.5]">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================= FOR HOSPITALS */}
        <section className="border-t border-[var(--border-subtle)]">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
            <div className="order-2 grid gap-4 sm:grid-cols-2 lg:order-1">
              {[
                { icon: Building2, title: "Multi-branch", body: "Run several locations from one console." },
                { icon: Users, title: "Team & seats", body: "Reception seats and per-doctor management." },
                { icon: Activity, title: "Group analytics", body: "Per-doctor and clinic-wide insight." },
                { icon: ShieldCheck, title: "Admin controls", body: "Approvals, visibility and audit trails." },
              ].map((c) => (
                <div key={c.title} className="card card-hover p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]" style={{ background: "var(--bg-brandSubtle)" }}>
                    <c.icon size={18} color="var(--text-brand)" aria-hidden />
                  </span>
                  <h3 className="mt-3 font-semibold text-[var(--text-primary)]">{c.title}</h3>
                  <p className="t-small mt-1 leading-[1.5]">{c.body}</p>
                </div>
              ))}
            </div>
            <Reveal className="order-1 lg:order-2">
              <div>
                <p className="t-eyebrow">For hospitals &amp; chains</p>
                <h2 className="t-h1 mt-3">Enterprise care operations</h2>
                <p className="t-body mt-4 max-w-md">
                  Bring every branch, doctor and schedule onto one platform — with the controls,
                  analytics and audit trails a large network needs.
                </p>
                <Link
                  href="/pricing"
                  className="mt-7 inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-5 text-[0.9375rem] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-sunken)]"
                >
                  Talk to sales <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================================================= MEMBERSHIP PREVIEW */}
        <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-sunken)]">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="t-eyebrow">Membership</p>
                <h2 className="t-h1 mt-3">Free to book. More with Care+.</h2>
                <p className="t-body mt-4">Booking is always free for patients. Upgrade only if you want more.</p>
              </div>
            </Reveal>
            <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
              {PATIENT_PLANS.map((plan) => {
                const featured = !!plan.highlighted;
                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col p-6 ${featured ? "card-brand" : "card"}`}
                  >
                    {featured && (
                      <span
                        className="absolute -top-2.5 left-6 rounded-[var(--radius-full)] px-2.5 py-0.5 text-[0.6875rem] font-semibold"
                        style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
                      >
                        Recommended
                      </span>
                    )}
                    <h3 className="text-[1.125rem] font-semibold text-[var(--text-primary)]">{plan.name}</h3>
                    <p className="t-small mt-0.5 min-h-[2.25rem]">{plan.tagline}</p>
                    <p className="mt-2">
                      <span className="tabular text-[1.75rem] font-bold text-[var(--text-primary)]">{plan.price}</span>{" "}
                      <span className="t-small">{plan.cycle}</span>
                    </p>
                    <Link
                      href="/sign-up"
                      className="mt-5 flex h-10 items-center justify-center rounded-[var(--radius-md)] text-[0.875rem] font-medium"
                      style={
                        featured
                          ? { background: "var(--bg-brand)", color: "var(--text-onBrand)" }
                          : { border: "1px solid var(--border-control)", color: "var(--text-primary)" }
                      }
                    >
                      {featured ? "Get Care+" : "Start free"}
                    </Link>
                    <ul className="mt-6 space-y-2.5">
                      {plan.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-[0.875rem]">
                          <BadgeCheck size={16} color="var(--text-success)" className="mt-0.5 shrink-0" aria-hidden />
                          <span className="text-[var(--text-secondary)]">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================= SECURITY & TRUST */}
        <section className="border-t border-[var(--border-subtle)]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="t-eyebrow">Security &amp; trust</p>
                <h2 className="t-h1 mt-3">Built for sensitive care data</h2>
              </div>
            </Reveal>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: LockKeyhole, title: "Encrypted records", body: "Data is protected in transit and at rest." },
                { icon: BadgeCheck, title: "Verified doctors", body: "Providers are reviewed before they go live." },
                { icon: CreditCard, title: "Secure payments", body: "Payments run on Razorpay — cards never touch us." },
                { icon: EyeOff, title: "Privacy first", body: "Row-level access controls on every record." },
              ].map((c, i) => (
                <Reveal key={c.title} delay={(i % 4) * 60}>
                  <div className="card card-hover h-full p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)]" style={{ background: "var(--bg-brandSubtle)" }}>
                      <c.icon size={20} color="var(--text-brand)" aria-hidden />
                    </span>
                    <h3 className="mt-4 font-semibold text-[var(--text-primary)]">{c.title}</h3>
                    <p className="t-small mt-1.5 leading-[1.6]">{c.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================= TESTIMONIALS (illustrative) */}
        <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-sunken)]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="t-eyebrow">Loved by patients &amp; clinics</p>
                <h2 className="t-h1 mt-3">Care that finally feels effortless</h2>
              </div>
            </Reveal>
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {[
                { quote: "Booked a cardiologist on my lunch break — confirmed instantly, no phone tag.", who: "Patient", where: "Care+ member" },
                { quote: "Our no-shows dropped and the calendar finally reflects reality.", who: "Front desk", where: "Multi-speciality clinic" },
                { quote: "Publishing my hours takes seconds, and patients see exactly when I'm free.", who: "Physician", where: "Cardiology" },
              ].map((t, i) => (
                <Reveal key={i} delay={i * 70}>
                  <figure className="card card-hover flex h-full flex-col p-6">
                    <Quote size={22} color="var(--text-brand)" aria-hidden />
                    <blockquote className="mt-3 flex-1 text-[1.0625rem] leading-[1.55] text-[var(--text-primary)]">
                      “{t.quote}”
                    </blockquote>
                    <figcaption className="mt-5 flex items-center gap-1 border-t border-[var(--border-subtle)] pt-4">
                      <span className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} size={13} color="var(--color-amber-500)" fill="var(--color-amber-500)" aria-hidden />
                        ))}
                      </span>
                      <span className="ml-2 text-[0.8125rem] text-[var(--text-muted)]">
                        <span className="font-medium text-[var(--text-secondary)]">{t.who}</span> · {t.where}
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
            <p className="mt-6 text-center text-[0.75rem] text-[var(--text-disabled)]">Illustrative feedback for this demo.</p>
          </div>
        </section>

        {/* ================================================= FAQ */}
        <section className="border-t border-[var(--border-subtle)]">
          <div className="mx-auto max-w-3xl px-6 py-24">
            <Reveal>
              <p className="t-eyebrow text-center">FAQ</p>
              <h2 className="t-h1 mt-3 text-center">Questions, answered</h2>
            </Reveal>
            <div className="mt-10 space-y-3">
              {[
                { q: "Does it cost anything to book?", a: "Curo is free for patients — always. You pay the doctor's consultation fee at the clinic." },
                { q: "How is a slot confirmed instantly?", a: "Every slot is computed live from the doctor's real schedule, and your booking is written straight to that source — there's no synced copy to fall out of date." },
                { q: "Can two people book the same time?", a: "No. A database-level constraint guarantees exactly one booking per slot. If someone takes it a second before you, you'll see the nearest open times instead." },
                { q: "Do I need an account to browse?", a: "No. Search, compare doctors and view availability freely — you only sign in at the moment you confirm." },
              ].map((f) => (
                <details key={f.q} className="card group px-5 py-4 [&_summary]:cursor-pointer">
                  <summary className="flex list-none items-center justify-between font-medium text-[var(--text-primary)]">
                    {f.q}
                    <ArrowRight size={16} className="shrink-0 text-[var(--text-muted)] transition-transform group-open:rotate-90" aria-hidden />
                  </summary>
                  <p className="t-small mt-3 leading-[1.6]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================= FINAL CTA */}
        <section className="px-6 py-20">
          <Reveal>
            <div className="gradient-brand relative mx-auto max-w-6xl overflow-hidden rounded-[var(--radius-xl)] px-8 py-16 text-center shadow-[var(--shadow-lg)]">
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl float-slow" />
              <h2 className="text-[2rem] font-bold tracking-[-0.02em] text-white sm:text-[2.5rem]">
                Your next appointment is 60 seconds away.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[1.0625rem] text-white/85">
                No calls, no hold music. Just a confirmed time.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/doctors"
                  className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-white px-6 text-[0.9375rem] font-semibold text-[var(--text-brand)] hover:bg-white/90"
                >
                  Find a doctor <ArrowRight size={16} aria-hidden />
                </Link>
                <Link
                  href="/apply"
                  className="inline-flex h-11 items-center rounded-[var(--radius-md)] border border-white/40 px-6 text-[0.9375rem] font-medium text-white hover:bg-white/10"
                >
                  Join as a doctor
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ================================================= FOOTER */}
        <footer className="border-t border-[var(--border-subtle)]">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
            <Logo className="h-7 w-auto" />
            <p className="t-small">A demo project · Book a doctor in sixty seconds</p>
            <nav className="t-small flex gap-6">
              <Link href="/doctors" className="hover:text-[var(--text-primary)]">Find a doctor</Link>
              <Link href="/pricing" className="hover:text-[var(--text-primary)]">For clinics</Link>
              <Link href="/dashboard" className="hover:text-[var(--text-primary)]">Doctor login</Link>
            </nav>
          </div>
        </footer>
      </main>
    </>
  );
}
