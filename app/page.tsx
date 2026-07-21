import Link from "next/link";
import type { ComponentType } from "react";
import {
  Stethoscope,
  Sparkles,
  HeartPulse,
  Baby,
  Bone,
  Brain,
  Search,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import type { Specialty } from "@/lib/types";

/** Seed stores an icon name per specialty; map it to a real component. */
const ICONS: Record<
  string,
  ComponentType<{ size?: number; color?: string; className?: string }>
> = {
  stethoscope: Stethoscope,
  sparkles: Sparkles,
  "heart-pulse": HeartPulse,
  baby: Baby,
  bone: Bone,
  brain: Brain,
};

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: specialties, error }, { count: doctorCount }] = await Promise.all([
    supabase.from("specialties").select("*").order("name"),
    supabase.from("doctors").select("*", { count: "exact", head: true }),
  ]);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-16">
        {/* Hero */}
        <div className="max-w-2xl">
          <h1 className="text-[3rem] font-bold leading-[1.1] tracking-tight text-[var(--text-primary)]">
            Book a doctor in
            <br />
            sixty seconds.
          </h1>
          <p className="mt-4 text-[1.25rem] leading-[1.5] text-[var(--text-muted)]">
            See real availability before you choose. No callbacks, no hold music —
            just a confirmed time.
          </p>
        </div>

        {/* Search */}
        <form
          action="/doctors"
          className="mt-8 flex max-w-2xl items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border-control)] bg-[var(--bg-surface)] p-2"
        >
          <label htmlFor="q" className="sr-only">
            Search by specialty, doctor or condition
          </label>
          <Search
            size={18}
            color="var(--text-muted)"
            className="ml-2 shrink-0"
            aria-hidden
          />
          <input
            id="q"
            name="q"
            placeholder="Specialty, doctor or condition"
            className="h-10 flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none"
          />
          <button
            type="submit"
            className="h-10 shrink-0 rounded-[var(--radius-md)] px-5 font-medium"
            style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
          >
            Search
          </button>
        </form>

        {doctorCount !== null && doctorCount !== undefined && (
          <p className="mt-3 text-[0.9375rem] text-[var(--text-muted)]">
            <span className="tabular font-medium text-[var(--text-primary)]">
              {doctorCount}
            </span>{" "}
            doctors accepting appointments today
          </p>
        )}

        {/* Specialties */}
        <section className="mt-14">
          <h2 className="text-[1.25rem] font-semibold text-[var(--text-primary)]">
            Browse by specialty
          </h2>

          {error ? (
            /* Error state — names the next action, never "something went wrong" */
            <div
              className="mt-4 flex items-start gap-3 rounded-[var(--radius-lg)] border p-4"
              style={{
                borderColor: "var(--border-danger)",
                background: "var(--bg-dangerSubtle)",
              }}
            >
              <AlertCircle size={18} color="var(--text-danger)" aria-hidden />
              <div>
                <p className="font-medium text-[var(--text-danger)]">
                  Couldn&apos;t load specialties
                </p>
                <p className="mt-1 text-[0.9375rem] text-[var(--text-muted)]">
                  Check that your Supabase keys are set in .env.local, then reload.
                </p>
              </div>
            </div>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(specialties as Specialty[] | null)?.map((s) => {
                const Icon = ICONS[s.icon] ?? Stethoscope;
                return (
                  <li key={s.id}>
                    <Link
                      href={`/doctors?specialty=${s.slug}`}
                      className="flex h-full items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition-shadow hover:shadow-[var(--shadow-md)]"
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
                        style={{ background: "var(--bg-brandSubtle)" }}
                      >
                        <Icon size={20} color="var(--text-brand)" />
                      </span>
                      <span>
                        <span className="block font-medium text-[var(--text-primary)]">
                          {s.name}
                        </span>
                        <span className="mt-1 block text-[0.8125rem] leading-[1.5] text-[var(--text-muted)]">
                          {s.description}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
