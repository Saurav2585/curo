import { createClient } from "@/lib/supabase/server";
import type { LifecycleEvent } from "@/lib/workflow";

/**
 * Server-side workflow data access. Kept out of lib/workflow.ts so the pure
 * engine stays client-safe. Reads are RLS-scoped (patient/doctor of the
 * appointment, or admin).
 */
export async function getLifecycleEvents(appointmentId: string): Promise<LifecycleEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointment_lifecycle_events")
    .select("*")
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: true });
  return (data ?? []) as LifecycleEvent[];
}
