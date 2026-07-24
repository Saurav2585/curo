import { LifeBuoy } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin-placeholder";

export const dynamic = "force-dynamic";

export default function AdminSupportPage() {
  return (
    <AdminPlaceholder
      title="Support"
      icon={LifeBuoy}
      body="Support items and escalations will be triaged here in a later phase."
    />
  );
}
