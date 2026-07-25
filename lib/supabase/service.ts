import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for TRUSTED server code only (payment
 * verification and webhooks). It bypasses RLS, so it must never be constructed
 * from anything driven by untrusted input, and the key must never reach the
 * browser. Used solely to call the security-definer payment functions after a
 * signature has been verified server-side.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Service client not configured (missing SUPABASE_SERVICE_ROLE_KEY).");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
