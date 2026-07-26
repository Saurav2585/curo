import { redirect } from "next/navigation";

/**
 * My Bookings now lives inside the patient portal at /account/bookings (sidebar
 * chrome). This route is kept so existing links and bookmarks keep working.
 */
export default function BookingsRedirect() {
  redirect("/account/bookings");
}
