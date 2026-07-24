"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Admin sets a provider's visibility level. Authority re-checked in the DB fn. */
export async function setVisibility(formData: FormData) {
  const supabase = await createClient();
  await supabase.rpc("set_provider_visibility", {
    p_doctor_id: String(formData.get("id")),
    p_level: String(formData.get("level")),
  });
  revalidatePath("/admin/sponsored");
}
