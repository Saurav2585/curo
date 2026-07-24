import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in user's role, or null if signed out. Used for role-aware
 * navigation and redirects across the app so every surface agrees on who the
 * user is.
 */
export async function getSessionRole(): Promise<
  { userId: string; role: "patient" | "doctor" | "admin" } | null
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return { userId: user.id, role: (data?.role as "patient" | "doctor" | "admin") ?? "patient" };
}

/** The correct landing page for a role. Admins get the console, doctors the
 *  portal, everyone else the patient app. */
export function roleHome(role: "patient" | "doctor" | "admin"): string {
  if (role === "admin") return "/admin";
  if (role === "doctor") return "/dashboard";
  return "/bookings";
}
