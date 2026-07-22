import { createClient } from "@/lib/supabase/server";

export type MyDoctor = {
  id: string;
  slug: string;
  full_name: string;
  consultation_fee: number;
  specialties: { name: string } | null;
  clinics: { name: string; city: string } | null;
};

/**
 * The doctor record owned by the signed-in user, or null. Every doctor-side
 * page calls this first and redirects to the patient app if it's null — that
 * is the role gate.
 *
 * Supabase infers embedded relations as arrays, but a to-one FK returns a
 * single object. We normalise to the real shape once here so every caller gets
 * clean, typed access instead of casting at each use.
 */
export async function getMyDoctor(): Promise<MyDoctor | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("doctors")
    .select(
      `id, slug, full_name, consultation_fee,
       specialties ( name ), clinics ( name, city )`
    )
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!data) return null;

  const one = <T>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

  return {
    id: data.id,
    slug: data.slug,
    full_name: data.full_name,
    consultation_fee: data.consultation_fee,
    specialties: one(data.specialties),
    clinics: one(data.clinics),
  };
}

export function clinicTzToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
