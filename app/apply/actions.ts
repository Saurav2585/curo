"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ApplyState = { error: string } | null;
export type DraftState = { error?: string; ok?: boolean } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Step 1 — create the login and an empty DRAFT application.
 * This never grants the doctor role and never creates a doctors row; it only
 * establishes an authenticated session so the applicant can upload documents
 * and save their draft. Role elevation happens only on admin approval.
 */
export async function startApplication(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const providerType = String(formData.get("provider_type") ?? "solo");

  if (!fullName) return { error: "Enter your full name." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 6) return { error: "Use a password of at least 6 characters." };
  if (!["solo", "clinic", "hospital"].includes(providerType))
    return { error: "Choose an account type." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) {
    if (error.message.toLowerCase().includes("already"))
      return { error: "An account with this email already exists. Sign in to continue your application." };
    return { error: error.message };
  }

  if (!data.session) {
    // Email confirmation is on — verify first, then resume the application.
    redirect(`/verify-email?email=${encodeURIComponent(email)}&next=/apply`);
  }

  const { error: draftError } = await supabase.from("provider_applications").insert({
    user_id: data.user!.id,
    full_name: fullName,
    email,
    provider_type: providerType,
    status: "draft",
  });
  if (draftError && !draftError.message.toLowerCase().includes("duplicate")) {
    return { error: "Couldn't start your application. Please try again." };
  }

  revalidatePath("/apply");
  redirect("/apply");
}

/** Autosave a section of the draft. Only the owner, only while draft/info-requested. */
export async function saveDraft(_prev: DraftState, formData: FormData): Promise<DraftState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const numeric = (v: FormDataEntryValue | null) => {
    const n = Number(String(v ?? "").trim());
    return Number.isFinite(n) && String(v ?? "").trim() !== "" ? n : null;
  };
  const languages = String(formData.get("languages") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const patch: Record<string, unknown> = {
    full_name: String(formData.get("full_name") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    bio: String(formData.get("bio") ?? "").trim() || null,
    years_experience: numeric(formData.get("years_experience")),
    languages,
    specialty: String(formData.get("specialty") ?? "").trim() || null,
    registration_number: String(formData.get("registration_number") ?? "").trim() || null,
    qualifications: String(formData.get("qualifications") ?? "").trim() || null,
    consultation_fee: numeric(formData.get("consultation_fee")) ?? 500,
    clinic_name: String(formData.get("clinic_name") ?? "").trim() || null,
    address_line: String(formData.get("address_line") ?? "").trim() || null,
    city: String(formData.get("city") ?? "").trim() || null,
    state: String(formData.get("state") ?? "").trim() || null,
    pin_code: String(formData.get("pin_code") ?? "").trim() || null,
  };
  // Document paths are uploaded client-side; persist whichever were provided.
  for (const key of ["reg_cert_path", "gov_id_path", "clinic_reg_path", "hospital_reg_path"]) {
    const v = String(formData.get(key) ?? "").trim();
    if (v) patch[key] = v;
  }

  const { error } = await supabase
    .from("provider_applications")
    .update(patch)
    .eq("user_id", user.id)
    .in("status", ["draft", "info_requested"]);

  if (error) return { error: "Couldn't save your changes. Please try again." };
  return { ok: true };
}

/** Final submit — validates completeness, then moves draft → submitted. */
export async function submitApplication(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  // Persist the latest field values first (reuse saveDraft's shape).
  await saveDraft(null, formData);

  const { data: app } = await supabase
    .from("provider_applications")
    .select("full_name, specialty, registration_number, qualifications, clinic_name, city, reg_cert_path, gov_id_path")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!app) return { error: "We couldn't find your application." };
  const missing: string[] = [];
  if (!app.full_name) missing.push("full name");
  if (!app.specialty) missing.push("specialty");
  if (!app.registration_number) missing.push("registration number");
  if (!app.qualifications) missing.push("qualifications");
  if (!app.clinic_name) missing.push("clinic/hospital name");
  if (!app.city) missing.push("city");
  if (!app.reg_cert_path) missing.push("registration certificate");
  if (!app.gov_id_path) missing.push("government ID");
  if (missing.length) return { error: `Please complete: ${missing.join(", ")}.` };

  const { error } = await supabase
    .from("provider_applications")
    .update({ status: "submitted" })
    .eq("user_id", user.id)
    .in("status", ["draft", "info_requested"]);
  if (error) return { error: "Couldn't submit your application. Please try again." };

  revalidatePath("/", "layout");
  redirect("/apply/status");
}
