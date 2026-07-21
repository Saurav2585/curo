import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for server components, route handlers and server actions.
 * In Next 15 `cookies()` is async, so this factory is too — always `await` it.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // Explicitly typed: @supabase/ssr declares `cookies` as a union of its
        // current and deprecated method shapes, so TypeScript can't contextually
        // infer this parameter and falls back to an implicit any — which passes
        // `next dev` but fails `next build`.
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            options?: any;
          }>
        ) {
          // Server components can't set cookies. Middleware refreshes the
          // session instead, so swallowing this is correct, not a workaround.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* called from a server component — safe to ignore */
          }
        },
      },
    }
  );
}
