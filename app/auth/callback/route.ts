import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / email-link return handler. Supabase redirects here with a `code`,
 * which we exchange for a session (PKCE). Then we forward to `next`.
 *
 * This route only runs for social sign-in and email-link flows; the password
 * and 6-digit-code flows never touch it.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
    ? nextParam
    : "/bookings";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  // Something went wrong — send them back to sign in with a gentle flag.
  return NextResponse.redirect(new URL("/sign-in?error=oauth", url.origin));
}
