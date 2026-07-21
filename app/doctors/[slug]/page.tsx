import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, MapPin, Clock, Languages, GraduationCap } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getDoctorBySlug, getNextSlots } from "@/lib/queries";
import { formatFee, slotDay, slotTime } from "@/lib/format";

export const dynamic = "force-dynamic";

function initials(fullName: string) {
  return fullName
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { doctor } = await getDoctorBySlug(slug);

  if (!doctor) notFound();

  const slotsByDoctor = await getNextSlots([doctor.id], 6);
  const slots = slotsByDoctor[doctor.id] ?? [];

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href={`/doctors?specialty=${doctor.specialties?.slug ?? ""}`}
          className="text-[0.9375rem] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          ← Back to {doctor.specialties?.name ?? "doctors"}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Left: credentials */}
          <div>
            <div className="flex gap-5">
              <span
                aria-hidden
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-[1.5rem] font-semibold"
                style={{
                  background: "var(--bg-brandSubtle)",
                  color: "var(--text-brand)",
                }}
              >
                {initials(doctor.full_name)}
              </span>

              <div>
                <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-[var(--text-primary)]">
                  {doctor.full_name}
                </h1>
                <p className="mt-1 text-[1.25rem] text-[var(--text-brand)]">
                  {doctor.specialties?.name}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[0.9375rem] text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <Star size={15} aria-hidden />
                    <span className="tabular font-medium text-[var(--text-primary)]">
                      {doctor.rating}
                    </span>
                    <span>({doctor.review_count} reviews)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={15} aria-hidden />
                    <span className="tabular">{doctor.experience_years}</span> years
                    experience
                  </span>
                </div>
              </div>
            </div>

            {doctor.bio && (
              <section className="mt-8">
                <h2 className="text-[1.25rem] font-semibold text-[var(--text-primary)]">
                  About
                </h2>
                <p className="mt-2 leading-relaxed text-[var(--text-secondary)]">
                  {doctor.bio}
                </p>
              </section>
            )}

            <section className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
                <h3 className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                  <GraduationCap size={16} color="var(--text-brand)" aria-hidden />
                  Qualifications
                </h3>
                <p className="mt-2 text-[0.9375rem] text-[var(--text-muted)]">
                  {doctor.qualifications}
                </p>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
                <h3 className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                  <Languages size={16} color="var(--text-brand)" aria-hidden />
                  Speaks
                </h3>
                <p className="mt-2 text-[0.9375rem] text-[var(--text-muted)]">
                  {doctor.languages.join(", ")}
                </p>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:col-span-2">
                <h3 className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                  <MapPin size={16} color="var(--text-brand)" aria-hidden />
                  Clinic
                </h3>
                <p className="mt-2 text-[0.9375rem] text-[var(--text-muted)]">
                  {doctor.clinics?.name}
                  <br />
                  {doctor.clinics?.address_line}, {doctor.clinics?.city}
                </p>
              </div>
            </section>
          </div>

          {/* Right: booking panel */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-sm)]">
              <div className="flex items-baseline justify-between">
                <span className="text-[0.8125rem] text-[var(--text-muted)]">
                  Consultation
                </span>
                <span className="tabular text-[1.5rem] font-semibold text-[var(--text-primary)]">
                  {formatFee(doctor.consultation_fee)}
                </span>
              </div>

              <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
                {slots.length === 0 ? (
                  /* Empty state — a real possibility, not a failure */
                  <>
                    <p className="text-[0.9375rem] font-medium text-[var(--text-primary)]">
                      No online slots in the next two weeks
                    </p>
                    <p className="mt-1 text-[0.8125rem] text-[var(--text-muted)]">
                      {doctor.clinics?.name} may hold walk-in appointments — worth
                      calling them directly.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[0.8125rem] text-[var(--text-muted)]">
                      Next available
                    </p>
                    <p className="mt-1 font-medium text-[var(--text-primary)]">
                      {slotDay(slots[0])}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {slots.map((slot) => (
                        <Link
                          key={slot}
                          href={`/doctors/${doctor.slug}/book?slot=${encodeURIComponent(slot)}`}
                          className="tabular rounded-[var(--radius-md)] border px-2 py-2 text-center text-[0.8125rem] font-medium"
                          style={{
                            borderColor: "var(--border-brand)",
                            color: "var(--text-brand)",
                          }}
                        >
                          {slotTime(slot)}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Link
                href={`/doctors/${doctor.slug}/book`}
                className="mt-5 flex h-12 items-center justify-center rounded-[var(--radius-md)] font-medium"
                style={{
                  background: "var(--bg-brand)",
                  color: "var(--text-onBrand)",
                }}
              >
                See all slots
              </Link>

              <p className="mt-3 text-center text-[0.75rem] text-[var(--text-muted)]">
                Pay at the clinic · Free cancellation
              </p>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
