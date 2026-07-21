export type SlotStatus = "available" | "booked" | "unavailable" | "past";

export type Specialty = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
};

export type Clinic = {
  id: string;
  name: string;
  address_line: string;
  city: string;
  phone: string | null;
};

export type Doctor = {
  id: string;
  slug: string;
  full_name: string;
  bio: string | null;
  qualifications: string;
  experience_years: number;
  consultation_fee: number;
  languages: string[];
  rating: number;
  review_count: number;
  photo_url: string | null;
  specialty_id: string;
  clinic_id: string;
};

export type Slot = {
  slot_start: string;
  slot_end: string;
  status: SlotStatus;
};

/** Initials for the avatar fallback — no doctor photos in the demo dataset. */
export function initials(fullName: string): string {
  return fullName
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatFee(fee: number): string {
  return `₹${Number(fee).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
