import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock, CheckCircle2, Sparkles, Ticket, ChevronRight, CalendarPlus, Stethoscope, Receipt,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPatientMembership } from "@/lib/subscription";
import { patientPlanName } from "@/lib/plans";
import { slotFull } from "@/lib/format";

export const dynamic = "force-dynamic";

function greeting(): string {
  const h = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false }).format(new Date())
  );
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function initials(name?: string): string {
  const parts = (name ?? "").replace(/^Dr\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "Dr";
}

function StatCard({
  label, value, sub, icon: Icon, primary = false,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: typeof CalendarClock;
  primary?: boolean;
}) {
  return (
    <div className={`${primary ? "card-brand" : "card"} card-hover p-6`}>
      <div className="flex items-start justify-between">
        <span className="text-[0.75rem] font-medium uppercase tracking-[0.05em] text-[var(--text-muted)]">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]" style={{ background: "var(--bg-brandSubtle)" }}>
          <Icon size={17} color="var(--text-brand)" aria-hidden />
        </span>
      </div>
      <p className="tabular mt-4 text-[2rem] font-bold leading-none tracking-[-0.02em] text-[var(--text-primary)]">{value}</p>
      <p className="mt-2 text-[0.8125rem] text-[var(--text-muted)]">{sub}</p>
    </div>
  );
}

export default async function AccountOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/account");

  const [{ data: profile }, membership, { data: rows }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    getPatientMembership(),
    supabase
      .from("appointments")
      .select("id, reference, starts_at, status, doctors ( full_name, specialties ( name ) )")
      .eq("patient_id", user.id)
      .order("starts_at", { ascending: false }),
  ]);

  const now = Date.now();
  const appts = rows ?? [];
  const upcoming = appts
    .filter((a) => a.status === "booked" && new Date(a.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const pastVisits = appts.filter((a) => a.status === "completed").length;

  const firstName = (profile?.full_name ?? "").split(" ")[0] || "there";
  const isFree = membership?.isFree ?? true;

  return (
    <main className="p-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.875rem] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-[0.9375rem] text-[var(--text-muted)]">
            Here&apos;s everything about your care in one place.
          </p>
        </div>
        <Link
          href="/doctors"
          className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] px-4 text-[0.9375rem] font-medium shadow-[var(--shadow-sm)]"
          style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
        >
          <CalendarPlus size={17} aria-hidden /> Book appointment
        </Link>
      </header>

      {/* Stat cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Upcoming" value={upcoming.length} sub="appointments booked" icon={CalendarClock} primary />
        <StatCard label="Past visits" value={pastVisits} sub="completed appointments" icon={CheckCircle2} />
        <StatCard
          label="Membership"
          value={patientPlanName(membership?.plan ?? "free")}
          sub={isFree ? "on the Free plan" : "premium member"}
          icon={Sparkles}
        />
        <StatCard
          label={isFree ? "Complimentary left" : "Appointments"}
          value={isFree ? (membership?.remaining ?? 0) : "Unlimited"}
          sub={isFree ? "free visits this month" : "with Care+"}
          icon={Ticket}
        />
      </div>

      {/* Upcoming appointments */}
      <section className="mt-8">
        <div className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[1.125rem] font-semibold text-[var(--text-primary)]">Upcoming appointments</h2>
            <Link href="/account/bookings" className="flex items-center gap-1 text-[0.875rem] font-medium text-[var(--text-brand)] hover:underline">
              View all <ChevronRight size={15} />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--bg-brandSubtle)" }}>
                <CalendarPlus size={22} color="var(--text-brand)" aria-hidden />
              </span>
              <p className="mt-3 text-[1.0625rem] font-semibold text-[var(--text-primary)]">No upcoming appointments</p>
              <p className="mt-1 text-[0.875rem] text-[var(--text-muted)]">Find a doctor and book your next visit.</p>
              <Link
                href="/doctors"
                className="mt-4 inline-flex h-10 items-center rounded-[var(--radius-md)] px-5 text-[0.9375rem] font-medium"
                style={{ background: "var(--bg-brand)", color: "var(--text-onBrand)" }}
              >
                Find a doctor
              </Link>
            </div>
          ) : (
            <ul className="-mx-2 space-y-0.5">
              {upcoming.slice(0, 5).map((a) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const doc = (a as any).doctors;
                return (
                  <li key={a.id}>
                    <Link
                      href={`/bookings/${a.id}`}
                      className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] px-2 py-2.5 transition-colors hover:bg-[var(--bg-sunken)]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.8125rem] font-semibold"
                          style={{ background: "var(--bg-brandSubtle)", color: "var(--text-brand)" }}
                          aria-hidden
                        >
                          {initials(doc?.full_name)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--text-primary)]">{doc?.full_name}</p>
                          <p className="text-[0.875rem] text-[var(--text-muted)]">{doc?.specialties?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 whitespace-nowrap">
                        <span className="tabular text-[0.875rem] text-[var(--text-secondary)]">{slotFull(a.starts_at)}</span>
                        <ChevronRight size={16} color="var(--text-muted)" aria-hidden />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Quick links */}
      <section className="mt-6 grid gap-5 sm:grid-cols-3">
        {[
          { href: "/doctors", icon: Stethoscope, label: "Find a doctor" },
          { href: "/account/membership", icon: Sparkles, label: isFree ? "Upgrade to Care+" : "Manage membership" },
          { href: "/account/billing", icon: Receipt, label: "Billing & invoices" },
        ].map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="card card-hover flex items-center gap-3 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]" style={{ background: "var(--bg-brandSubtle)" }}>
              <Icon size={18} color="var(--text-brand)" aria-hidden />
            </span>
            <span className="font-medium text-[var(--text-primary)]">{label}</span>
            <ChevronRight size={16} color="var(--text-disabled)" className="ml-auto" aria-hidden />
          </Link>
        ))}
      </section>
    </main>
  );
}
