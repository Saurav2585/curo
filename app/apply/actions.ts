"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ApplyState = { error: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Provider application. This deliberately does TWO safe things and never a third:
 *   1. Creates a normal auth account (role stays patient-level).
 *   2. Records a PENDING application row.
 * It never sets role = 'doctor' and never creates a doctors row — that only
 * happens through admin approval. A client can't grant itself provider access.
 */
export async function submitProviderApplication(
  _prev: ApplyState,
  formData: FormData
): Promise<ApplyState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const clinicName = String(formData.get("clinic_name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const specialty = String(formData.get("specialty") ?? "").trim();
  const registration = String(formData.get("registration_number") ?? "").trim();
  const qualifications = String(formData.get("qualifications") ?? "").trim();
  const terms = formData.get("terms");

  if (!fullName) return { error: "Enter your full name." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 6) return { error: "Use a password of at least 6 characters." };
  if (!clinicName) return { error: "Enter your clinic or hospital name." };
  if (!city) return { error: "Enter the city you practise in." };
  if (!specialty) return { error: "Enter your specialty." };
  if (!registration) return { error: "Enter your medical registration number." };
  if (!qualifications) return { error: "Enter your qualifications." };
  if (!terms) return { error: "Please accept the Terms of Service and Privacy Policy." };

  const supabase = await createClient();

  // Create the login. Role is NOT touched here — it stays at the default.
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (signUpError) {
    if (signUpError.message.toLowerCase().includes("already"))
      return { error: "An account with this email already exists. Sign in to continue your application." };
    return { error: signUpError.message };
  }

  // Need an authenticated session to write the application under RLS. With email
  // confirmation disabled (current demo setting) signUp returns a session.
  if (!signUpData.session) {
    // Confirmation is enabled: the user must verify first, then re-submit while
    // signed in. Send them to verification; the application form can be resumed.
    redirect(`/verify-email?email=${encodeURIComponent(email)}&next=/apply`);
  }

  const { error: appError } = await supabase.from("provider_applications").insert({
    user_id: signUpData.user!.id,
    full_name: fullName,
    email,
    phone: phone || null,
    clinic_name: clinicName,
    city,
    specialty,
    registration_number: registration,
    qualifications,
  });

  if (appError) {
    if (appError.message.toLowerCase().includes("duplicate"))
      return { error: "You've already submitted an application. Check its status." };
    return { error: "Couldn't submit your application. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/apply/status");
}
