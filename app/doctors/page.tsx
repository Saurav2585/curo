import Link from "next/link";
import type { ReactNode } from "react";
import { AlertCircle, SearchX, Search, X } from "lucide-react";
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

  const [{ doctors, error, appliedSpecialty, nameQuery }, { specialties, cities }] =
    await Promise.all([getDoctors({ specialty, city, q }), getFilterOptions()]);

  const nextSlots = await getNextSlots(doctors.map((d) => d.id));

  const buildHref = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = {
      specialty: appliedSpecialty ?? undefined,
      city,
      // Only a genuine name search survives a filter change. If the query
      // resolved to a specialty it is already represented above.
      q: nameQuery ?? undefined,
      ...patch,
    };
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

        {/* Search by name or specialty. A GET form keeps the query in the URL,
            so results stay shareable and the back button behaves. */}
        <form action="/doctors" className="mt-6 flex max-w-xl items-center gap-2">
          {appliedSpecialty && (
            <input type="hidden" name="specialty" value={appliedSpecialty} />
          )}
          {city && <input type="hidden" name="city" value={city} />}

          <div className="flex flex-1 items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border-control)] bg-[var(--bg-surface)] px-3">
            <label htmlFor="doctor-search" className="sr-only">
              Search by doctor name or specialty
            </label>
            <Search size={17} color="var(--text-muted)" aria-hidden />
            <input
              id="doctor-search"
              name="q"
              defaultValue={nameQuery ?? ""}
              placeholder="Search by doctor name or specialty"
              className="h-11 flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="h-11 shrink-0 rounded-[var(--radius-md)] px-5 font-medium"
            style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
          >
            Search
          </button>
        </form>

        {nameQuery && (
          <p className="mt-3 flex items-center gap-2 text-[0.9375rem] text-[var(--text-muted)]">
            Showing matches for
            <span className="font-medium text-[var(--text-primary)]">
              “{nameQuery}”
            </span>
            <Link
              href={buildHref({ q: undefined })}
              className="inline-flex items-center gap-1 rounded-[var(--radius-full)] px-2 py-0.5 text-[0.8125rem]"
              style={{
                background: "var(--bg-sunken)",
                color: "var(--text-secondary)",
              }}
            >
              <X size={13} aria-hidden />
              Clear
            </Link>
          </p>
        )}

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
                {nameQuery
                  ? `No doctor's name matches “${nameQuery}”. Try a specialty instead — or check the spelling.`
                  : "Try widening the specialty or city."}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                {nameQuery && (
                  <Link
                    href={buildHref({ q: undefined })}
                    className="rounded-[var(--radius-md)] border border-[var(--border-control)] px-4 py-2 text-[0.9375rem] text-[var(--text-primary)]"
                  >
                    Clear search
                  </Link>
                )}
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
