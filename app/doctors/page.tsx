import Link from "next/link";
import type { ReactNode } from "react";
import { AlertCircle, SearchX } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { DoctorCard } from "@/components/doctor-card";
import { getDoctors, getNextSlots, getFilterOptions } from "@/lib/queries";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ specialty?: string; city?: string; q?: string }>;

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-[var(--radius-full)] border px-3.5 py-1.5 text-[0.8125rem] font-medium transition-colors"
      style={
        active
          ? {
              background: "var(--bg-brand)",
              borderColor: "var(--bg-brand)",
              color: "var(--text-onBrand)",
            }
          : {
              background: "var(--bg-surface)",
              borderColor: "var(--border-control)",
              color: "var(--text-secondary)",
            }
      }
    >
      {children}
    </Link>
  );
}

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { specialty, city, q } = params;

  const [{ doctors, error, appliedSpecialty }, { specialties, cities }] =
    await Promise.all([getDoctors({ specialty, city, q }), getFilterOptions()]);

  const nextSlots = await getNextSlots(doctors.map((d) => d.id));

  const buildHref = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { specialty: appliedSpecialty ?? undefined, city, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const qs = next.toString();
    return qs ? `/doctors?${qs}` : "/doctors";
  };

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-[2rem] font-bold tracking-tight text-[var(--text-primary)]">
          {appliedSpecialty
            ? specialties.find((s) => s.slug === appliedSpecialty)?.name
            : "All doctors"}
          {city ? ` in ${city}` : ""}
        </h1>

        {/* Filters */}
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            <FilterPill href={buildHref({ specialty: undefined })} active={!appliedSpecialty}>
              All specialties
            </FilterPill>
            {specialties.map((s) => (
              <FilterPill
                key={s.slug}
                href={buildHref({ specialty: s.slug })}
                active={appliedSpecialty === s.slug}
              >
                {s.name}
              </FilterPill>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterPill href={buildHref({ city: undefined })} active={!city}>
              All cities
            </FilterPill>
            {cities.map((c) => (
              <FilterPill key={c} href={buildHref({ city: c })} active={city === c}>
                {c}
              </FilterPill>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="mt-8">
          {error ? (
            <div
              className="flex items-start gap-3 rounded-[var(--radius-lg)] border p-5"
              style={{
                borderColor: "var(--border-danger)",
                background: "var(--bg-dangerSubtle)",
              }}
            >
              <AlertCircle size={18} color="var(--text-danger)" aria-hidden />
              <div>
                <p className="font-medium text-[var(--text-danger)]">
                  Couldn&apos;t load doctors
                </p>
                <p className="mt-1 text-[0.9375rem] text-[var(--text-muted)]">
                  Your filters are still set. Reload the page to try again.
                </p>
              </div>
            </div>
          ) : doctors.length === 0 ? (
            /* Empty state: name the likely culprit and offer one tap out of it */
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center">
              <SearchX
                size={28}
                color="var(--text-disabled)"
                className="mx-auto"
                aria-hidden
              />
              <p className="mt-3 text-[1.25rem] font-semibold text-[var(--text-primary)]">
                No doctors match these filters
              </p>
              <p className="mt-1 text-[var(--text-muted)]">
                {q
                  ? `Nothing matched “${q}”.`
                  : "Try widening the specialty or city."}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                {city && (
                  <Link
                    href={buildHref({ city: undefined, q: undefined })}
                    className="rounded-[var(--radius-md)] border border-[var(--border-control)] px-4 py-2 text-[0.9375rem] text-[var(--text-primary)]"
                  >
                    Clear city
                  </Link>
                )}
                <Link
                  href="/doctors"
                  className="rounded-[var(--radius-md)] px-4 py-2 text-[0.9375rem] font-medium"
                  style={{
                    background: "var(--bg-brand)",
                    color: "var(--text-onBrand)",
                  }}
                >
                  Show all doctors
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[0.9375rem] text-[var(--text-muted)]">
                <span className="tabular font-medium text-[var(--text-primary)]">
                  {doctors.length}
                </span>{" "}
                {doctors.length === 1 ? "doctor" : "doctors"} available
              </p>
              <ul className="mt-4 space-y-4">
                {doctors.map((doctor) => (
                  <li key={doctor.id}>
                    <DoctorCard doctor={doctor} nextSlots={nextSlots[doctor.id] ?? []} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </main>
    </>
  );
}
