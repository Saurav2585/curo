"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string } | null;
export type VerifyState = { error?: string; info?: string } | null;

/**
 * `next` carries the user back to wherever they were — critically, to a booking
 * confirm URL if they signed in mid-flow. Everything is validated server-side;
 * the client form is a convenience, not the gate.
 */
function safeNext(next: FormData | string | null): string {
  const raw = typeof next === "string" ? next : null;
  // Only allow internal paths — never an open redirect to another origin.
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/bookings";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const rawNext = String(formData.get("next") ?? "");
  // Distinguish an explicit destination from the default, so we can send users
  // to the right home for their role when no explicit next was given.
  const explicitNext =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;

  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (!password) return { error: "Enter your password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("invalid"))
      return { error: "That email and password don't match. Try again or reset your password." };
    if (error.message.toLowerCase().includes("confirm"))
      return { error: "Please verify your email first — check your inbox for the code." };
    return { error: error.message };
  }

  revalidatePath("/", "layout");

  if (explicitNext) redirect(explicitNext);

  // No explicit destination → send each role to its own home.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user!.id)
    .maybeSingle();
  redirect(profile?.role === "doctor" ? "/dashboard" : "/bookings");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");
  const terms = formData.get("terms");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!fullName) return { error: "Tell us your name so doctors know who's booking." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 6) return { error: "Use a password of at least 6 characters." };
  if (password !== confirm) return { error: "Passwords don't match." };
  if (!terms) return { error: "Please accept the Terms of Service and Privacy Policy." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already"))
      return { error: "An account with this email already exists. Sign in instead." };
    return { error: error.message };
  }

  revalidatePath("/", "layout");

  // Non-breaking by design:
  //  • If "Confirm email" is OFF in Supabase, signUp returns a live session →
  //    the account is active now, so we go straight in (instant demo signup).
  //  • If it's ON, there is no session yet and Supabase has emailed a code →
  //    we route to the verification screen.
  if (data.session) redirect(next);
  redirect(`/verify-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
}

export async function verifyEmailCode(
  _prev: VerifyState,
  formData: FormData
): Promise<VerifyState> {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("code") ?? "").replace(/\s/g, "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!/^\d{6}$/.test(token)) return { error: "Enter the 6-digit code from your email." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });

  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("expired")) return { error: "That code has expired. Request a new one." };
    if (m.includes("invalid") || m.includes("token"))
      return { error: "That code isn't correct. Check and try again." };
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function resendCode(
  _prev: VerifyState,
  formData: FormData
): Promise<VerifyState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL_RE.test(email)) return { error: "We couldn't read your email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) return { error: error.message };
  return { info: "A new code is on its way to your inbox." };
}

export async function requestPasswordReset(
  _prev: VerifyState,
  formData: FormData
): Promise<VerifyState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };

  const supabase = await createClient();
  // Harmless if the address has no account — Supabase does not reveal that.
  await supabase.auth.resetPasswordForEmail(email);
  return { info: "If that email has an account, a reset link is on its way." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
