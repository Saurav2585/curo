/**
 * Reusable profile-completeness score. Each surface supplies the factors it can
 * see as a list of {label, done}; the maths lives here, once. Equal weight per
 * factor keeps it transparent.
 */

export type CompletenessItem = { label: string; done: boolean };

export type Completeness = {
  percent: number;
  done: number;
  total: number;
  items: CompletenessItem[];
  missing: string[];
};

export function computeCompleteness(items: CompletenessItem[]): Completeness {
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  return {
    percent: total ? Math.round((done / total) * 100) : 0,
    done,
    total,
    items,
    missing: items.filter((i) => !i.done).map((i) => i.label),
  };
}

/** Standard provider completeness factors, in one place so every surface agrees. */
export function providerCompletenessItems(input: {
  hasPhoto: boolean;
  hasBio: boolean;
  hasFee: boolean;
  hasAddress: boolean;
  hasRegistration: boolean;
  hasDocuments: boolean;
  hasLanguages: boolean;
  hasAvailability: boolean;
}): CompletenessItem[] {
  return [
    { label: "Profile photo", done: input.hasPhoto },
    { label: "Professional bio", done: input.hasBio },
    { label: "Consultation fee", done: input.hasFee },
    { label: "Clinic address", done: input.hasAddress },
    { label: "Registration number", done: input.hasRegistration },
    { label: "Verification documents", done: input.hasDocuments },
    { label: "Languages spoken", done: input.hasLanguages },
    { label: "Consulting hours", done: input.hasAvailability },
  ];
}
