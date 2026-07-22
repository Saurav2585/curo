"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string } | null;

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

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("invalid"))
      return { error: "That email and password don't match. Try again or reset your password." };
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!fullName) return { error: "Tell us your name so doctors know who's booking." };
  if (!email) return { error: "Enter your email." };
  if (password.length < 6) return { error: "Use a password of at least 6 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
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
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
