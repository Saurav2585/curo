"use client";

import { useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

/** Brand mark as inline SVG so it renders crisply with no extra deps. */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}

function SocialButton({
  provider,
  label,
  icon,
  next,
}: {
  provider: "google" | "facebook";
  label: string;
  icon: ReactNode;
  next?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback${
      next ? `?next=${encodeURIComponent(next)}` : ""
    }`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    // If the provider isn't enabled in Supabase yet, fail gracefully with an
    // inline message rather than a jarring dialog or a hang. On success the
    // browser is already navigating away. This is the Facebook graceful path.
    if (error) {
      setLoading(false);
      setError(`${label} isn't available right now. Please use email${provider === "facebook" ? " or Google" : ""} to continue.`);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--bg-surface)] text-[0.9375rem] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-sunken)] disabled:opacity-60"
      >
        {loading ? (
          <span className="text-[var(--text-muted)]">Connecting…</span>
        ) : (
          <>
            {icon}
            {label}
          </>
        )}
      </button>
      {error && (
        <p className="mt-1.5 text-[0.75rem] text-[var(--text-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function SocialAuth({ next }: { next?: string }) {
  return (
    <div className="space-y-3">
      <SocialButton provider="google" label="Continue with Google" icon={<GoogleIcon />} next={next} />
      <SocialButton provider="facebook" label="Continue with Facebook" icon={<FacebookIcon />} next={next} />

      <div className="flex items-center gap-3 py-1" aria-hidden>
        <span className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
        <span className="text-[0.75rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
          or
        </span>
        <span className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
      </div>
    </div>
  );
}
