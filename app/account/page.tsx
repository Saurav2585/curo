import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock, CheckCircle2, Sparkles, Ticket, ChevronRight, CalendarPlus, Stethoscope,
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

function StatCard({
  label, value, sub, icon: Icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: typeof CalendarClock;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-start justify-between">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--bg-brandSubtle)" }}>
          <Icon size={16} color="var(--text-brand)" aria-hidden />
        </span>
      </div>
      <p className="tabular mt-2 text-[2rem] font-bold leading-none text-[var(--text-primary)]">{value}</p>
      <p className="mt-1.5 text-[0.8125rem] text-[var(--text-muted)]">{sub}</p>
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
      <h1 className="text-[2rem] font-bold tracking-tight text-[var(--text-primary)]">
        {greeting()}, {firstName}
      </h1>
      <p className="mt-1 text-[var(--text-muted)]">Here&apos;s everything about your care in one place.</p>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Upcoming" value={upcoming.length} sub="appointments booked" icon={CalendarClock} />
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
        <div className="flex items-center justify-between">
          <h2 className="text-[1.125rem] font-semibold text-[var(--text-primary)]">Upcoming appointments</h2>
          <Link href="/account/bookings" className="flex items-center gap-1 text-[0.875rem] font-medium text-[var(--text-brand)] hover:underline">
            View all <ChevronRight size={15} />
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="mt-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--bg-brandSubtle)" }}>
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
          <ul className="mt-3 space-y-3">
            {upcoming.slice(0, 5).map((a) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const doc = (a as any).doctors;
              return (
                <li key={a.id}>
                  <Link
                    href={`/bookings/${a.id}`}
                    className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition-shadow hover:shadow-[var(--shadow-sm)]"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text-primary)]">{doc?.full_name}</p>
                      <p className="text-[0.875rem] text-[var(--text-muted)]">{doc?.specialties?.name}</p>
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
      </section>

      {/* Quick links */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/doctors" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 hover:bg-[var(--bg-sunken)]">
          <Stethoscope size={18} color="var(--text-brand)" aria-hidden />
          <span className="font-medium text-[var(--text-primary)]">Find a doctor</span>
        </Link>
        <Link href="/account/membership" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 hover:bg-[var(--bg-sunken)]">
          <Sparkles size={18} color="var(--text-brand)" aria-hidden />
          <span className="font-medium text-[var(--text-primary)]">{isFree ? "Upgrade to Care+" : "Manage membership"}</span>
        </Link>
        <Link href="/account/billing" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 hover:bg-[var(--bg-sunken)]">
          <Ticket size={18} color="var(--text-brand)" aria-hidden />
          <span className="font-medium text-[var(--text-primary)]">Billing &amp; invoices</span>
        </Link>
      </section>
    </main>
  );
}
