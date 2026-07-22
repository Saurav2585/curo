import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ConfirmForm } from "./confirm-form";
import { getDoctorBySlug } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { formatFee, slotFull } from "@/lib/format";
import type { Slot } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ slot?: string }>;
}) {
  const [{ slug }, { slot }] = await Promise.all([params, searchParams]);
  if (!slot) redirect(`/doctors/${slug}/book`);

  const { doctor } = await getDoctorBySlug(slug);
  if (!doctor) notFound();

  const supabase = await createClient();

  // Re-validate the slot server-side. A URL can be stale or hand-edited; the
  // grid's word is not enough to commit on.
  const slotDate = slot.slice(0, 10);
  const { data: slots } = await supabase.rpc("get_available_slots", {
    p_doctor_id: doctor.id,
    p_date: slotDate,
  });

  const match = (slots as Slot[] | null)?.find((s) => s.slot_start === slot);

  if (!match || match.status !== "available") {
    // Someone took it, or it never existed. Back to the grid, which will show truth.
    redirect(`/doctors/${doctor.slug}/book?date=${slotDate}&taken=1`);
  }

  // Prefill from the signed-in profile when we have one — but auth is not
  // required to *see* this page, only to submit it.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let defaultName = "";
  let defaultPhone = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();
    defaultName = profile?.full_name ?? "";
    defaultPhone = profile?.phone ?? "";
  }

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-md px-6 py-10">
        <Link
          href={`/doctors/${doctor.slug}/book?date=${slotDate}`}
          className="text-[0.9375rem] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          ← Change time
        </Link>

        <h1 className="mt-4 text-[2rem] font-bold tracking-tight text-[var(--text-primary)]">
          Confirm your appointment
        </h1>

        {/* Pinned slot summary — stays visible as the form is filled */}
        <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-brandSubtle)] p-4">
          <div className="flex items-start gap-3">
            <CalendarClock size={20} color="var(--text-brand)" className="mt-0.5" aria-hidden />
            <div>
              <p className="font-semibold text-[var(--text-primary)]">{doctor.full_name}</p>
              <p className="text-[0.9375rem] text-[var(--text-secondary)]">
                {doctor.specialties?.name}
              </p>
              <p className="tabular mt-1 font-medium text-[var(--text-brand)]">
                {slotFull(match.slot_start)}
              </p>
              <p className="tabular mt-1 text-[0.8125rem] text-[var(--text-muted)]">
                {formatFee(doctor.consultation_fee)} · pay at the clinic
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <ConfirmForm
            doctor={{ id: doctor.id, slug: doctor.slug }}
            slotStart={match.slot_start}
            slotEnd={match.slot_end}
            defaultName={defaultName}
            defaultPhone={defaultPhone}
          />
        </div>

        {!user && (
          <p className="mt-4 text-center text-[0.8125rem] text-[var(--text-muted)]">
            You&apos;ll sign in to confirm — your slot is held until you do.
          </p>
        )}
      </main>
    </>
  );
}
