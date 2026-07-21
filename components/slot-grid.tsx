"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slotTime } from "@/lib/format";
import type { Slot } from "@/lib/types";

/**
 * The signature screen. A doctor's day as a seat map.
 *
 * State is carried by colour AND border weight AND a label — never colour
 * alone — so the grid survives colour blindness and greyscale printing.
 */

type Session = { label: string; slots: Slot[] };

/**
 * "Filling fast" is a property of the session, not the slot.
 *
 * A percentage rule ("under 30% free") reads well but almost never fires on a
 * six-slot session, which left the legend advertising a state the product never
 * showed. A count is what a person actually reasons about: two left is scarce
 * whether the session holds six slots or sixteen.
 */
const FILLING_FAST_AT_OR_BELOW = 2;

/**
 * Sessions split at 1pm, not noon. Clinics here run a 9–1 morning and a 5–8
 * evening, so a noon cutoff orphaned the 12:00 and 12:30 slots into a
 * two-slot "Afternoon" group that matches nothing in the real day.
 */
const MORNING_ENDS_AT = 13;
const AFTERNOON_ENDS_AT = 17;

function groupIntoSessions(slots: Slot[]): Session[] {
  const hourOf = (iso: string) =>
    Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        hour12: false,
      }).format(new Date(iso))
    );

  const buckets: Record<string, Slot[]> = { Morning: [], Afternoon: [], Evening: [] };
  for (const slot of slots) {
    const h = hourOf(slot.slot_start);
    if (h < MORNING_ENDS_AT) buckets.Morning.push(slot);
    else if (h < AFTERNOON_ENDS_AT) buckets.Afternoon.push(slot);
    else buckets.Evening.push(slot);
  }

  return Object.entries(buckets)
    .filter(([, s]) => s.length > 0)
    .map(([label, s]) => ({ label, slots: s }));
}

function chipStyle(state: "available" | "filling" | "taken" | "selected") {
  switch (state) {
    case "selected":
      return {
        background: "var(--bg-brand)",
        color: "var(--text-onBrand)",
        borderColor: "var(--bg-brand)",
        borderWidth: "var(--border-thick)",
      };
    case "filling":
      return {
        background: "var(--bg-warnSubtle)",
        color: "var(--text-warn)",
        borderColor: "var(--color-amber-500)",
        borderWidth: "var(--border-thick)",
      };
    case "taken":
      return {
        background: "var(--bg-sunken)",
        color: "var(--text-muted)",
        borderColor: "var(--border-subtle)",
        borderWidth: "var(--border-hairline)",
      };
    default:
      return {
        background: "var(--bg-surface)",
        color: "var(--text-brand)",
        borderColor: "var(--border-brand)",
        borderWidth: "var(--border-hairline)",
      };
  }
}

export function SlotLegend() {
  const items = [
    { state: "available" as const, label: "Available" },
    { state: "filling" as const, label: "Filling fast" },
    { state: "taken" as const, label: "Booked" },
  ];
  return (
    <ul className="flex flex-wrap items-center gap-4">
      {items.map(({ state, label }) => (
        <li key={state} className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-4 w-7 rounded-[var(--radius-sm)] border"
            style={chipStyle(state)}
          />
          <span className="text-[0.8125rem] text-[var(--text-muted)]">{label}</span>
        </li>
      ))}
    </ul>
  );
}

export function SlotGrid({
  slots,
  doctorSlug,
  fee,
}: {
  slots: Slot[];
  doctorSlug: string;
  fee: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const sessions = groupIntoSessions(slots);

  return (
    <>
      <div className="space-y-8">
        {sessions.map((session) => {
          const openCount = session.slots.filter((s) => s.status === "available").length;
          const isScarce = openCount > 0 && openCount <= FILLING_FAST_AT_OR_BELOW;

          return (
            <section key={session.label}>
              <h3 className="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                {session.label}
                <span className="ml-2 tabular font-normal normal-case tracking-normal">
                  {openCount} of {session.slots.length} free
                </span>
                {isScarce && (
                  <span
                    className="ml-2 rounded-[var(--radius-full)] px-2 py-0.5 text-[0.6875rem] font-medium normal-case tracking-normal"
                    style={{
                      background: "var(--bg-warnSubtle)",
                      color: "var(--text-warn)",
                    }}
                  >
                    Filling fast
                  </span>
                )}
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {session.slots.map((slot) => {
                  const bookable = slot.status === "available";
                  const isSelected = selected === slot.slot_start;
                  const state = isSelected
                    ? "selected"
                    : !bookable
                      ? "taken"
                      : isScarce
                        ? "filling"
                        : "available";

                  const statusLabel = !bookable
                    ? slot.status === "past"
                      ? "no longer available"
                      : slot.status === "unavailable"
                        ? "doctor unavailable"
                        : "already booked"
                    : isScarce
                      ? "available, filling fast"
                      : "available";

                  return (
                    <button
                      key={slot.slot_start}
                      type="button"
                      disabled={!bookable}
                      aria-pressed={isSelected}
                      aria-label={`${slotTime(slot.slot_start)} — ${statusLabel}`}
                      onClick={() => setSelected(slot.slot_start)}
                      className="tabular h-11 min-w-[5.5rem] rounded-[var(--radius-md)] border px-3 text-[0.9375rem] font-medium transition-all disabled:cursor-not-allowed"
                      style={chipStyle(state)}
                    >
                      {slotTime(slot.slot_start)}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Sticky commit bar — appears only once a slot is chosen, so the page
          stays calm until there is a decision to confirm. */}
      {selected && (
        <div className="sticky bottom-0 z-10 -mx-6 mt-10 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-4 shadow-[var(--shadow-lg)]">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div>
              <p className="text-[0.8125rem] text-[var(--text-muted)]">Selected</p>
              <p className="tabular font-semibold text-[var(--text-primary)]">
                {slotTime(selected)} · {fee}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/doctors/${doctorSlug}/book/confirm?slot=${encodeURIComponent(selected)}`
                )
              }
              className="h-12 rounded-[var(--radius-md)] px-6 font-medium"
              style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </>
  );
}
