"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Cancelling flips status to 'cancelled'. Because the double-book index is
 * partial (WHERE status = 'booked'), the row drops out of it and the slot
 * returns to available immediately — no extra bookkeeping.
 */
export async function cancelBooking(formData: FormData) {
  const id = String(formData.get("booking_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS also enforces ownership; the explicit filter makes intent clear.
  await supabase
    .from("appointments")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", id)
    .eq("patient_id", user.id);

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${id}`);
}
