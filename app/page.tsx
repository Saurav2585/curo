import Link from "next/link";
import type { ComponentType } from "react";
import {
  Stethoscope, Sparkles, HeartPulse, Baby, Bone, Brain,
  Search, CalendarCheck, MousePointerClick, ArrowRight,
  Eye, LockKeyhole, Zap, ArrowUpRight,
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
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <div>
            <p className="t-eyebrow">Real-time availability</p>
            <h1 className="t-display mt-4 max-w-xl">
              Book a real doctor in under a minute.
            </h1>
            <p className="t-lead mt-5 max-w-md">
              See a doctor&apos;s whole day like a seat map, pick an open slot, and
              get a confirmed appointment. No callbacks, no hold music.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/doctors"
                className="flex h-11 items-center gap-2 rounded-[var(--radius-md)] px-5 text-[0.9375rem] font-medium text-[var(--text-onBrand)]"
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

            {/* quiet metric row */}
            <dl className="mt-12 flex gap-10">
              {[
                { n: doctorCount ?? 12, l: "Doctors" },
                { n: specialties?.length ?? 6, l: "Specialties" },
                { n: "60s", l: "To book" },
              ].map((m) => (
                <div key={m.l}>
                  <dt className="tabular text-[1.75rem] font-bold leading-none text-[var(--text-primary)]">{m.n}</dt>
                  <dd className="t-small mt-1">{m.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Reveal delay={100} className="lg:pl-4">
            <HeroMockup />
          </Reveal>
        </section>

        {/* ================================================= PROBLEM */}
        <section className="border-t border-[var(--border-subtle)]">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center">
            <Reveal>
              <p className="t-eyebrow">Why Curo</p>
              <h2 className="t-h1 mt-3">
                Other sites show you a doctor, then make you call to find out when
                they&apos;re free.
              </h2>
              <p className="t-body mt-5">
                They hold a stale copy of the calendar, so bookings bounce and times
                go wrong. Curo removes the copy — every slot is computed live from the
                doctor&apos;s own schedule, and a booking is written straight to the
                source. That&apos;s why a confirmation is actually confirmed.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ================================================= FEATURES (restrained grid) */}
        <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-sunken)]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="grid gap-x-12 gap-y-12 sm:grid-cols-3">
              {[
                { icon: Eye, title: "See real availability", body: "A doctor's day as a seat map — available, filling fast, or taken, at a glance. Read the week and commit in one tap." },
                { icon: LockKeyhole, title: "No double-bookings", body: "Two patients can't take the same slot. It's guaranteed at the database, not hoped for in code." },
                { icon: Zap, title: "Under 60 seconds", body: "Search, pick, confirm. Sign-in waits until the slot is chosen, so nothing slows the path to booked." },
              ].map((f, i) => (
                <Reveal key={f.title} delay={i * 70}>
                  <div>
                    <f.icon size={22} color="var(--text-brand)" aria-hidden />
                    <h3 className="t-h3 mt-4">{f.title}</h3>
                    <p className="t-small mt-2 leading-[1.6]">{f.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================= SPECIALTIES */}
        <section className="border-t border-[var(--border-subtle)]">
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

            <ul className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-2 lg:grid-cols-3">
              {(specialties as Specialty[] | null)?.map((s) => {
                const Icon = ICONS[s.icon] ?? Stethoscope;
                return (
                  <li key={s.id}>
                    <Link
                      href={`/doctors?specialty=${s.slug}`}
                      className="group flex h-full items-start gap-4 bg-[var(--bg-surface)] p-6 transition-colors hover:bg-[var(--bg-canvas)]"
                    >
                      <Icon size={20} color="var(--text-brand)" className="mt-0.5 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between font-medium text-[var(--text-primary)]">
                          {s.name}
                          <ArrowUpRight size={16} className="text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                        </span>
                        <span className="t-small mt-1 block leading-[1.5]">{s.description}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ================================================= HOW IT WORKS */}
        <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-sunken)]">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <Reveal>
              <p className="t-eyebrow text-center">How it works</p>
              <h2 className="t-h1 mt-3 text-center">Booked in three steps</h2>
            </Reveal>
            <div className="mt-14 grid gap-10 sm:grid-cols-3">
              {[
                { icon: Search, title: "Find", body: "Search by specialty, city or name. Fees and ratings shown upfront." },
                { icon: MousePointerClick, title: "Pick a slot", body: "Read the doctor's whole day like a seat map and choose an open time." },
                { icon: CalendarCheck, title: "Confirmed", body: "One tap books it. Get a reference and add it to your calendar." },
              ].map((step, i) => (
                <Reveal key={step.title} delay={i * 70}>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="tabular text-[0.8125rem] font-semibold text-[var(--text-brand)]">
                        0{i + 1}
                      </span>
                      <span className="h-px flex-1" style={{ background: "var(--border-default)" }} />
                    </div>
                    <step.icon size={22} color="var(--text-primary)" className="mt-5" aria-hidden />
                    <h3 className="t-h3 mt-3">{step.title}</h3>
                    <p className="t-small mt-2 leading-[1.6]">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================= FAQ */}
        <section className="border-t border-[var(--border-subtle)]">
          <div className="mx-auto max-w-3xl px-6 py-24">
            <Reveal>
              <p className="t-eyebrow text-center">FAQ</p>
              <h2 className="t-h1 mt-3 text-center">Questions, answered</h2>
            </Reveal>
            <div className="mt-10 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
              {[
                { q: "Does it cost anything to book?", a: "Curo is free for patients — always. You pay the doctor's consultation fee at the clinic." },
                { q: "How is a slot confirmed instantly?", a: "Every slot is computed live from the doctor's real schedule, and your booking is written straight to that source — there's no synced copy to fall out of date." },
                { q: "Can two people book the same time?", a: "No. A database-level constraint guarantees exactly one booking per slot. If someone takes it a second before you, you'll see the nearest open times instead." },
                { q: "Do I need an account to browse?", a: "No. Search, compare doctors and view availability freely — you only sign in at the moment you confirm." },
              ].map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-[var(--text-primary)]">
                    {f.q}
                    <ArrowRight size={16} className="shrink-0 text-[var(--text-muted)] transition-transform group-open:rotate-90" aria-hidden />
                  </summary>
                  <p className="t-small mt-3 leading-[1.6]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================= CTA */}
        <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-sunken)]">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center">
            <Reveal>
              <h2 className="t-h1">Your next appointment is 60 seconds away.</h2>
              <p className="t-body mt-3">No calls, no hold music. Just a confirmed time.</p>
              <Link
                href="/doctors"
                className="mt-8 inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] px-6 text-[0.9375rem] font-medium text-[var(--text-onBrand)]"
                style={{ background: "var(--bg-brand)" }}
              >
                Find a doctor <ArrowRight size={16} aria-hidden />
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ================================================= FOOTER */}
        <footer className="border-t border-[var(--border-subtle)]">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)]" style={{ background: "var(--bg-brand)" }}>
                <CalendarCheck size={16} color="var(--text-onBrand)" aria-hidden />
              </span>
              <span className="font-semibold text-[var(--text-primary)]">Curo</span>
            </div>
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
