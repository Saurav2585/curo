import { CalendarDays } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin-placeholder";

export const dynamic = "force-dynamic";

export default function AdminAppointmentsPage() {
  return (
    <AdminPlaceholder
      title="Appointments"
      icon={CalendarDays}
      body="A platform-wide appointments view will live here. Individual schedules remain managed by each provider."
    />
  );
}
