import { getSessionRole } from "@/lib/roles";
import { listNotifications, getUnreadCount } from "@/lib/notifications";
import { NotificationMenu } from "@/components/notification-menu";

/**
 * Server wrapper for the notification bell. Fetches the signed-in user's
 * notifications and unread count, then hands them to the client dropdown.
 * Renders nothing for signed-out visitors. Drop this into any header/sidebar.
 */
export async function NotificationBell() {
  const session = await getSessionRole();
  if (!session) return null;

  const [items, unread] = await Promise.all([
    listNotifications(session.userId),
    getUnreadCount(session.userId),
  ]);

  return <NotificationMenu items={items} unread={unread} />;
}
