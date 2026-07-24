import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, CheckCircle2, XCircle, AlertCircle, Stethoscope } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";

export const dynamic = "force-dynamic";

const STATUS_UI: Record<
  string,
  { icon: typeof Clock; tint: string; title: string; body: string }
> = {
  draft: {
    icon: Clock,
    tint: "var(--text-muted)",
    title: "Application in progress",
    body: "Your application isn't submitted yet. Pick up where you left off whenever you're ready.",
  },
  submitted: {
    icon: Clock,
    tint: "var(--text-warn)",
    title: "Application submitted",
    body: "Thanks — we've received your application and it's queued for review. We'll verify your credentials and be in touch shortly.",
  },
  pending: {
    icon: Clock,
    tint: "var(--text-warn)",
    title: "Application under review",
    body: "Thanks for applying. Our team is reviewing your details and will verify your credentials shortly. You'll get access to your dashboard as soon as you're approved.",
  },
  under_review: {
    icon: Clock,
    tint: "var(--text-warn)",
    title: "Application under review",
    body: "Our team is actively reviewing your application. No action is needed from you right now.",
  },
  info_requested: {
    icon: AlertCircle,
    tint: "var(--text-warn)",
    title: "More information needed",
    body: "We need a little more to verify your practice. Please check the note below and reply to our email.",
  },
  approved: {
    icon: CheckCircle2,
    tint: "var(--text-success)",
    title: "You're approved",
    body: "Welcome to Curo. Your provider dashboard is ready.",
  },
  rejected: {
    icon: XCircle,
    tint: "var(--text-danger)",
    title: "Application not approved",
    body: "Unfortunately we couldn't approve this application. See the note below for details.",
  },
  suspended: {
    icon: XCircle,
    tint: "var(--text-danger)",
    title: "Access suspended",
    body: "Your provider access is currently suspended. Please contact support.",
  },
};

export default async function ApplyStatusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/apply/status");

  const { data: app } = await supabase
    .from("provider_applications")
    .select("status, review_notes, clinic_name, specialty, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  // No application on this account — point them at the entry.
  if (!app) redirect("/apply");

  const ui = STATUS_UI[app.status] ?? STATUS_UI.pending;
  const Icon = ui.icon;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]" style={{ background: "var(--bg-brand)" }}>
          <Stethoscope size={20} color="var(--text-onBrand)" aria-hidden />
        </span>
        <span className="text-[1.5rem] font-semibold text-[var(--text-primary)]">Curo</span>
      </Link>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-center shadow-[var(--shadow-sm)]">
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "var(--bg-sunken)" }}
        >
          <Icon size={26} color={ui.tint} aria-hidden />
        </span>
        <h1 className="mt-4 text-[1.5rem] font-semibold text-[var(--text-primary)]">{ui.title}</h1>
        <p className="mt-2 text-[0.9375rem] leading-[1.6] text-[var(--text-muted)]">{ui.body}</p>

        <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 text-left text-[0.8125rem]">
          <p className="text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text-secondary)]">Practice:</span> {app.clinic_name}
          </p>
          <p className="mt-0.5 text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text-secondary)]">Specialty:</span> {app.specialty}
          </p>
        </div>

        {app.review_notes && (
          <div
            className="mt-3 rounded-[var(--radius-md)] border p-3 text-left text-[0.8125rem]"
            style={{ borderColor: "var(--color-amber-500)", background: "var(--bg-warnSubtle)" }}
          >
            <p className="font-medium text-[var(--text-warn)]">Note from our team</p>
            <p className="mt-1 text-[var(--text-secondary)]">{app.review_notes}</p>
          </div>
        )}

        {app.status === "approved" ? (
          <Link
            href="/dashboard"
            className="mt-6 inline-flex h-11 items-center rounded-[var(--radius-md)] px-6 font-medium"
            style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
          >
            Go to dashboard
          </Link>
        ) : app.status === "draft" || app.status === "info_requested" ? (
          <Link
            href="/apply"
            className="mt-6 inline-flex h-11 items-center rounded-[var(--radius-md)] px-6 font-medium"
            style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
          >
            Continue application
          </Link>
        ) : (
          <form action={signOut} className="mt-6">
            <button type="submit" className="text-[0.875rem] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              Sign out
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-center text-[0.8125rem] text-[var(--text-muted)]">
        Questions? Email{" "}
        <a href="mailto:providers@curo.demo" className="font-medium text-[var(--text-brand)] hover:underline">
          providers@curo.demo
        </a>
      </p>
    </main>
  );
}
