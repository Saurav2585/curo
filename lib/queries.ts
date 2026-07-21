import { createClient } from "@/lib/supabase/server";

export type DoctorRow = {
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
  specialties: { name: string; slug: string } | null;
  clinics: { name: string; city: string; address_line: string } | null;
};

export type DoctorFilters = {
  specialty?: string;
  city?: string;
  q?: string;
};

const DOCTOR_SELECT = `
  id, slug, full_name, bio, qualifications, experience_years,
  consultation_fee, languages, rating, review_count,
  specialties!inner ( name, slug ),
  clinics!inner ( name, city, address_line )
`;

/**
 * A free-text query might be a doctor's name OR a specialty ("cardiology").
 * Resolve it against specialties first — typing a specialty into the search box
 * is the more common intent, and silently returning nothing for it would be
 * the kind of dead end the brief rules out.
 */
async function resolveQuery(q: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("specialties")
    .select("slug")
    .ilike("name", `%${q}%`)
    .limit(1)
    .maybeSingle();
  return data?.slug ?? null;
}

export async function getDoctors(filters: DoctorFilters) {
  const supabase = await createClient();

  let specialtySlug = filters.specialty ?? null;
  let nameSearch: string | null = null;

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    const matched = specialtySlug ? null : await resolveQuery(q);
    if (matched) specialtySlug = matched;
    else nameSearch = q;
  }

  let query = supabase.from("doctors").select(DOCTOR_SELECT).eq("is_active", true);

  if (specialtySlug) query = query.eq("specialties.slug", specialtySlug);
  if (filters.city) query = query.eq("clinics.city", filters.city);
  if (nameSearch) query = query.ilike("full_name", `%${nameSearch}%`);

  const { data, error } = await query.order("rating", { ascending: false });

  return {
    doctors: (data ?? []) as unknown as DoctorRow[],
    error,
    appliedSpecialty: specialtySlug,
  };
}

export async function getDoctorBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("doctors")
    .select(DOCTOR_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  return { doctor: data as unknown as DoctorRow | null, error };
}

/** Next N open slots for many doctors, in a single round trip. */
export async function getNextSlots(doctorIds: string[], limit = 3) {
  if (doctorIds.length === 0) return {} as Record<string, string[]>;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("doctors_next_slots", {
    p_doctor_ids: doctorIds,
    p_limit: limit,
  });

  if (error || !data) return {} as Record<string, string[]>;

  const byDoctor: Record<string, string[]> = {};
  for (const row of data as { doctor_id: string; slot_start: string }[]) {
    (byDoctor[row.doctor_id] ??= []).push(row.slot_start);
  }
  return byDoctor;
}

export async function getFilterOptions() {
  const supabase = await createClient();
  const [{ data: specialties }, { data: clinics }] = await Promise.all([
    supabase.from("specialties").select("name, slug").order("name"),
    supabase.from("clinics").select("city").order("city"),
  ]);

  const cities = Array.from(new Set((clinics ?? []).map((c) => c.city)));
  return { specialties: specialties ?? [], cities };
}
