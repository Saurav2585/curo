import Link from "next/link";
import { Star, MapPin, Clock } from "lucide-react";
import type { DoctorRow } from "@/lib/queries";
import { formatFee, slotDay, slotTime } from "@/lib/format";

function initials(fullName: string) {
  return fullName
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function DoctorCard({
  doctor,
  nextSlots,
}: {
  doctor: DoctorRow;
  /** undefined = still loading; [] = genuinely none free in 14 days */
  nextSlots?: string[];
}) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition-shadow hover:shadow-[var(--shadow-md)]">
      <div className="flex gap-4">
        <span
          aria-hidden
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[1rem] font-semibold"
          style={{ background: "var(--bg-brandSubtle)", color: "var(--text-brand)" }}
        >
          {initials(doctor.full_name)}
        </span>

        <div className="min-w-0 flex-1">
          <Link
            href={`/doctors/${doctor.slug}`}
            className="text-[1.25rem] font-semibold leading-snug text-[var(--text-primary)] hover:underline"
          >
            {doctor.full_name}
          </Link>

          <p className="mt-0.5 text-[0.9375rem] text-[var(--text-brand)]">
            {doctor.specialties?.name}
          </p>

          <p className="mt-1 text-[0.8125rem] text-[var(--text-muted)]">
            {doctor.qualifications}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[0.8125rem] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Star size={14} aria-hidden />
              <span className="tabular font-medium text-[var(--text-primary)]">
                {doctor.rating}
              </span>
              <span>({doctor.review_count})</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} aria-hidden />
              <span className="tabular">{doctor.experience_years}</span> yrs
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} aria-hidden />
              {doctor.clinics?.name}, {doctor.clinics?.city}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="tabular text-[1.25rem] font-semibold text-[var(--text-primary)]">
            {formatFee(doctor.consultation_fee)}
          </p>
          <p className="text-[0.75rem] text-[var(--text-muted)]">consultation</p>
        </div>
      </div>

      {/* Availability on the card — the whole point. You should never have to
          open a profile to find out when someone is free. */}
      <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
        {nextSlots === undefined ? (
          <p className="text-[0.8125rem] text-[var(--text-muted)]">
            Checking availability…
          </p>
        ) : nextSlots.length === 0 ? (
          <p className="text-[0.8125rem] text-[var(--text-muted)]">
            No open slots in the next two weeks —{" "}
            <Link
              href={`/doctors/${doctor.slug}`}
              className="text-[var(--text-brand)] underline"
            >
              see full schedule
            </Link>
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.8125rem] text-[var(--text-muted)]">
              {slotDay(nextSlots[0])}
            </span>
            {nextSlots.map((slot) => (
              <Link
                key={slot}
                href={`/doctors/${doctor.slug}/book?slot=${encodeURIComponent(slot)}`}
                className="tabular rounded-[var(--radius-md)] border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors"
                style={{
                  borderColor: "var(--border-brand)",
                  color: "var(--text-brand)",
                }}
              >
                {slotTime(slot)}
              </Link>
            ))}
            <Link
              href={`/doctors/${doctor.slug}/book`}
              className="ml-auto text-[0.8125rem] font-medium text-[var(--text-brand)] hover:underline"
            >
              All slots →
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
