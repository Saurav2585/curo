import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PatientNav } from "@/components/patient-nav";
import { NotificationBell } from "@/components/notification-bell";

export const dynamic = "force-dynamic";

/**
 * Patient account portal shell. Mirrors the doctor portal: a left sidebar plus a
 * content area. Requires a signed-in user; the individual pages keep their own
 * data gates too.
 */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen">
      <PatientNav patientName={profile?.full_name ?? ""} bell={<NotificationBell />} />
      <div className="flex-1 bg-[var(--bg-canvas)]">{children}</div>
    </div>
  );
}
