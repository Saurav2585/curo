import { Settings } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin-placeholder";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return (
    <AdminPlaceholder
      title="Settings"
      icon={Settings}
      body="Platform configuration and admin preferences will live here."
    />
  );
}
