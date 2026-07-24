import { Megaphone } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin-placeholder";

export const dynamic = "force-dynamic";

export default function AdminSponsoredPage() {
  return (
    <AdminPlaceholder
      title="Sponsored Listings"
      icon={Megaphone}
      body="Featured and sponsored placement management will live here — clearly labelled and capped for patient safety."
    />
  );
}
