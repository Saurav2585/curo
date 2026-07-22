import Link from "next/link";
import type { ComponentType } from "react";
import {
  Stethoscope, Sparkles, HeartPulse, Baby, Bone, Brain,
  Search, CalendarCheck, MousePointerClick, ArrowRight, Star,
  Zap, Database, Eye, LockKeyhole, Quote,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { HeroMockup } from "@/components/hero-mockup";
import { Reveal } from "@/components/reveal";
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

  return (
    <>
      <SiteHeader />

      <main>
        {/* ================================================= HERO */}
        <section className="relative overflow-hidden">
          {/* soft gradient wash */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 60% at 75% 0%, var(--bg-brandSubtle) 0%, transparent 70%), radial-gradient(50% 50% at 0% 20%, color-mix(in srgb, var(--color-teal-100) 50%, transparent) 0%, transparent 60%)",
            }}
          />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
            <div>
              <span className="ring-hairline inline-flex items-center gap-1.5 rounded-[var(--radius-full)] bg-[var(--bg-surface)] px-3 py-1 text-[0.8125rem] font-medium text-[var(--text-secondary)]">
                <span className="flex h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-teal-500)" }} />
                Real-time availability, not callbacks
              </span>

              <h1 className="mt-5 text-[3rem] font-bold leading-[1.02] tracking-[-0.02em] text-[var(--text-primary)] sm:text-[3.75rem]">
                The fastest way to
                <br />
                book <span className="gradient-text">a real doctor.</span>
              </h1>

              <p className="mt-5 max-w-md text-[1.1875rem] leading-[1.55] text-[var(--text-secondary)]">
                See a doctor&apos;s whole day like a seat map, pick an open slot,
                and get a confirmed appointment — in under a minute. No hold music,
                no &ldquo;we&apos;ll call you back&rdquo;.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/doctors"
                  className="lift flex h-12 items-center gap-2 rounded-[var(--radius-md)] px-6 font-medium text-[var(--text-onBrand)] shadow-ambient"
                  style={{ background: "var(--bg-brand)" }}
                >
                  Find a doctor <ArrowRight size={17} aria-hidden />
                </Link>
                <Link
                  href="/pricing"
                  className="ring-hairline flex h-12 items-center rounded-[var(--radius-md)] bg-[var(--bg-surface)] px-6 font-medium text-[var(--text-primary)] hover:bg-[var(--bg-sunken)]"
                >
                  For clinics
                </Link>
              </div>

              {/* inline proof */}
              <div className="mt-8 flex items-center gap-5 text-[0.8125rem] text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <Star size={15} color="var(--color-amber-500)" aria-hidden />
                  <span className="font-semibold text-[var(--text-primary)]">4.8</span> avg rating
                </span>
                <span className="h-4 w-px" style={{ background: "var(--border-default)" }} />
                <span>
                  <span className="tabular font-semibold text-[var(--text-primary)]">{doctorCount ?? 12}</span> doctors
                </span>
                <span className="h-4 w-px" style={{ background: "var(--border-default)" }} />
                <span>
                  <span className="tabular font-semibold text-[var(--text-primary)]">{specialties?.length ?? 6}</span> specialties
                </span>
              </div>
            </div>

            {/* product mockup */}
            <Reveal delay={120} className="lg:pl-6">
              <HeroMockup />
            </Reveal>
          </div>

          {/* promo banner */}
          <div className="mx-auto max-w-6xl px-6 pb-4">
            <div
              className="ring-hairline relative flex flex-col items-start gap-4 overflow-hidden rounded-[var(--radius-xl)] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8"
              style={{
                background:
                  "linear-gradient(100deg, var(--bg-brandSubtle) 0%, color-mix(in srgb, var(--color-teal-100) 60%, var(--bg-surface)) 60%, var(--bg-surface) 100%)",
              }}
            >
              {/* decorative blobs */}
              <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full opacity-40 blur-2xl" style={{ background: "var(--color-teal-200)" }} />

              <div className="relative">
                <p className="text-[1.375rem] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
                  Feeling unwell? See a doctor today.
                </p>
                <p className="mt-1 text-[0.9375rem] text-[var(--text-secondary)]">
                  Same-day slots across {specialties?.length ?? 6} specialties — book in under a minute.
                </p>
              </div>

              <div className="relative flex items-center gap-3">
                <span className="hidden items-center gap-2 rounded-[var(--radius-full)] bg-[var(--bg-surface)] px-3 py-1.5 text-[0.8125rem] font-medium text-[var(--text-brand)] shadow-[var(--shadow-sm)] sm:inline-flex">
                  <span className="flex h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-teal-500)" }} />
                  {doctorCount ?? 12} doctors online now
                </span>
                <Link
                  href="/doctors"
                  className="lift flex h-11 shrink-0 items-center gap-2 rounded-[var(--radius-md)] px-5 font-medium text-[var(--text-onBrand)] shadow-ambient"
                  style={{ background: "var(--bg-brand)" }}
                >
                  Consult now <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================= PROBLEM → SOLUTION */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--text-brand)]">
              The problem
            </p>
            <h2 className="mt-2 max-w-2xl text-[2.25rem] font-bold leading-tight tracking-[-0.02em] text-[var(--text-primary)]">
              Every other booking site shows you a doctor, then makes you call to
              find out when they&apos;re free.
            </h2>
            <p className="mt-4 max-w-2xl text-[1.0625rem] leading-[1.6] text-[var(--text-muted)]">
              The platform holds a stale copy of the calendar, so &ldquo;confirmed&rdquo;
              bookings bounce, times are wrong, and no-shows pile up. Curo removes the
              copy entirely — every slot is computed live from the doctor&apos;s own
              schedule, and a booking is written straight to the source.
            </p>
          </Reveal>
        </section>

        {/* ================================================= BENTO FEATURES */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="grid gap-4 md:grid-cols-3">
            {/* big cell */}
            <Reveal className="h-full md:col-span-2">
              <div className="ring-hairline lift h-full rounded-[var(--radius-xl)] bg-[var(--bg-surface)] p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)]" style={{ background: "var(--bg-brandSubtle)" }}>
                  <Eye size={22} color="var(--text-brand)" aria-hidden />
                </span>
                <h3 className="mt-4 text-[1.375rem] font-semibold text-[var(--text-primary)]">
                  Availability you can actually see
                </h3>
                <p className="mt-2 max-w-lg text-[0.9375rem] leading-[1.6] text-[var(--text-muted)]">
                  A doctor&apos;s day rendered like a cinema seat map — available, filling
                  fast, or taken, all at a glance. No back-and-forth, no guessing. Read the
                  whole week and commit in one tap.
                </p>
              </div>
            </Reveal>

            <Reveal delay={80} className="h-full">
              <div className="ring-hairline lift h-full rounded-[var(--radius-xl)] bg-[var(--bg-surface)] p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)]" style={{ background: "var(--bg-successSubtle)" }}>
                  <LockKeyhole size={22} color="var(--text-success)" aria-hidden />
                </span>
                <h3 className="mt-4 text-[1.375rem] font-semibold text-[var(--text-primary)]">
                  No double-bookings, ever
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-[1.6] text-[var(--text-muted)]">
                  Two patients can&apos;t take the same slot — it&apos;s enforced at the
                  database, not hoped for in code.
                </p>
              </div>
            </Reveal>

            <Reveal delay={40} className="h-full">
              <div className="ring-hairline lift h-full rounded-[var(--radius-xl)] bg-[var(--bg-surface)] p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)]" style={{ background: "var(--bg-brandSubtle)" }}>
                  <Zap size={22} color="var(--text-brand)" aria-hidden />
                </span>
                <h3 className="mt-4 text-[1.375rem] font-semibold text-[var(--text-primary)]">
                  Under 60 seconds
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-[1.6] text-[var(--text-muted)]">
                  Search, pick, confirm. Auth waits until the slot is chosen, so nothing
                  slows the path to booked.
                </p>
              </div>
            </Reveal>

            <Reveal delay={80} className="h-full md:col-span-2">
              <div className="ring-hairline lift h-full rounded-[var(--radius-xl)] bg-[var(--bg-surface)] p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)]" style={{ background: "var(--bg-brandSubtle)" }}>
                  <Database size={22} color="var(--text-brand)" aria-hidden />
                </span>
                <h3 className="mt-4 text-[1.375rem] font-semibold text-[var(--text-primary)]">
                  One source of truth for every clinic
                </h3>
                <p className="mt-2 max-w-lg text-[0.9375rem] leading-[1.6] text-[var(--text-muted)]">
                  Doctors set consulting hours once; patients only ever see real, bookable
                  times. Row-level security keeps every workspace&apos;s data private by
                  default.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================================================= SPECIALTIES */}
        <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-sunken)]">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--text-brand)]">
                    Care for every concern
                  </p>
                  <h2 className="mt-2 text-[2.25rem] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
                    Browse by specialty
                  </h2>
                </div>
                <Link href="/doctors" className="hidden shrink-0 items-center gap-1.5 text-[0.9375rem] font-medium text-[var(--text-brand)] hover:gap-2.5 sm:inline-flex" style={{ transition: "gap 0.2s" }}>
                  All doctors <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
            </Reveal>

            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(specialties as Specialty[] | null)?.map((s, i) => {
                const Icon = ICONS[s.icon] ?? Stethoscope;
                return (
                  <li key={s.id} className="h-full">
                    <Reveal delay={i * 40} className="h-full">
                      <Link
                        href={`/doctors?specialty=${s.slug}`}
                        className="ring-hairline lift group flex h-full items-start gap-4 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-5"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--bg-brandSubtle)" }}>
                          <Icon size={22} color="var(--text-brand)" />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 font-semibold text-[var(--text-primary)]">
                            {s.name}
                            <ArrowRight size={15} className="opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                          </span>
                          <span className="mt-1 block text-[0.875rem] leading-[1.5] text-[var(--text-muted)]">
                            {s.description}
                          </span>
                        </span>
                      </Link>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ================================================= HOW IT WORKS */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <p className="text-center text-[0.8125rem] font-semibold uppercase tracking-wide text-[var(--text-brand)]">
              How it works
            </p>
            <h2 className="mt-2 text-center text-[2.25rem] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
              Booked in three steps
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              { icon: Search, title: "Find", body: "Search by specialty, city or name. Fees and ratings shown upfront — no surprises." },
              { icon: MousePointerClick, title: "Pick a slot", body: "Read the doctor's whole day like a seat map. Available, filling fast, or taken." },
              { icon: CalendarCheck, title: "Confirmed", body: "One tap books it. Get a reference and add it to your calendar. Pay at the clinic." },
            ].map((step, i) => (
              <Reveal key={step.title} delay={i * 80}>
                <div className="text-center">
                  <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full shadow-ambient" style={{ background: "var(--bg-brand)" }}>
                    <step.icon size={24} color="var(--text-onBrand)" aria-hidden />
                    <span className="tabular absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[0.75rem] font-bold" style={{ background: "var(--bg-surface)", borderColor: "var(--bg-canvas)", color: "var(--text-brand)" }}>
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="mt-4 text-[1.25rem] font-semibold text-[var(--text-primary)]">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-[0.9375rem] leading-[1.55] text-[var(--text-muted)]">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ================================================= SOCIAL PROOF */}
        <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-sunken)]">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal>
              <h2 className="max-w-2xl text-[2.25rem] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
                Loved by patients and clinics alike
              </h2>
              {/* Honest note kept in code, not shown: these are illustrative
                  placeholder quotes for a demo — replace with real ones before launch. */}
            </Reveal>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { q: "I booked a cardiologist on my lunch break. The slot grid is genuinely faster than calling.", a: "Priya M.", r: "Patient, Bengaluru" },
                { q: "Front desk stopped playing phone tag. No-shows dropped because every booking is real.", a: "Sunrise Clinic", r: "Practice, 6 doctors" },
                { q: "Finally a booking tool that shows my actual availability instead of a guess.", a: "Dr. Rajesh Iyer", r: "Cardiologist" },
              ].map((t, i) => (
                <Reveal key={t.a} delay={i * 60} className="h-full">
                  <figure className="ring-hairline flex h-full flex-col rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-6">
                    <Quote size={20} color="var(--text-brand)" aria-hidden />
                    <blockquote className="mt-3 flex-1 text-[0.9375rem] leading-[1.6] text-[var(--text-secondary)]">
                      &ldquo;{t.q}&rdquo;
                    </blockquote>
                    <figcaption className="mt-4">
                      <p className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{t.a}</p>
                      <p className="text-[0.8125rem] text-[var(--text-muted)]">{t.r}</p>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================= FAQ */}
        <section className="mx-auto max-w-3xl px-6 py-20">
          <Reveal>
            <h2 className="text-center text-[2.25rem] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
              Questions, answered
            </h2>
          </Reveal>
          <div className="mt-8 space-y-3">
            {[
              { q: "Does it cost anything to book?", a: "Curo is free for patients — always. You pay the doctor's consultation fee at the clinic. Clinics choose a plan based on how many doctors they list." },
              { q: "How is a slot confirmed instantly?", a: "Every slot is computed live from the doctor's real schedule, and your booking is written straight to that source. There's no synced copy to fall out of date, so a confirmation is genuinely confirmed." },
              { q: "Can two people book the same time?", a: "No. A database-level constraint guarantees exactly one booking per slot. If someone takes it a second before you, you'll see the nearest open times instead — your details are kept." },
              { q: "Do I need an account to browse?", a: "No. Search, compare doctors, and view availability freely. You only sign in at the moment you confirm a booking." },
            ].map((f) => (
              <Reveal key={f.q}>
                <details className="ring-hairline group rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-[var(--text-primary)]">
                    {f.q}
                    <ArrowRight size={16} className="shrink-0 text-[var(--text-muted)] transition-transform group-open:rotate-90" aria-hidden />
                  </summary>
                  <p className="mt-3 text-[0.9375rem] leading-[1.6] text-[var(--text-muted)]">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ================================================= CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <Reveal>
            <div className="relative overflow-hidden rounded-[var(--radius-xl)] px-8 py-14 text-center shadow-ambient">
              <div aria-hidden className="gradient-brand absolute inset-0 -z-10" />
              <h2 className="mx-auto max-w-lg text-[2.25rem] font-bold leading-tight tracking-[-0.02em] text-[var(--text-onBrand)]">
                Your next appointment is 60 seconds away.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[1.0625rem] text-[var(--text-onBrand)] opacity-90">
                No calls, no waiting rooms on hold. Just a confirmed time.
              </p>
              <Link
                href="/doctors"
                className="lift mt-7 inline-flex h-12 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--bg-surface)] px-7 font-semibold text-[var(--text-brand)] shadow-ambient"
              >
                Find a doctor <ArrowRight size={17} aria-hidden />
              </Link>
            </div>
          </Reveal>
        </section>

        {/* ================================================= FOOTER */}
        <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)]" style={{ background: "var(--bg-brand)" }}>
                <CalendarCheck size={16} color="var(--text-onBrand)" aria-hidden />
              </span>
              <span className="font-semibold text-[var(--text-primary)]">Curo</span>
            </div>
            <p className="text-[0.8125rem] text-[var(--text-muted)]">
              A demo project · Book a doctor in sixty seconds
            </p>
            <nav className="flex gap-5 text-[0.875rem] text-[var(--text-muted)]">
              <Link href="/doctors" className="hover:text-[var(--text-primary)]">Find a doctor</Link>
              <Link href="/pricing" className="hover:text-[var(--text-primary)]">For clinics</Link>
            </nav>
          </div>
        </footer>
      </main>
    </>
  );
}
