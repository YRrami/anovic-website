import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { markAllNotificationsRead, markNotificationRead, openNotification } from "../actions";
import type { TeamNotification } from "../_lib/data";

type NotificationMenuProps = {
  notifications: TeamNotification[];
  unreadCount: number;
  returnTo: string;
};

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function notificationTone(type: TeamNotification["type"]) {
  if (type === "task_assigned" || type === "task_updated") return "bg-indigo-50 text-indigo-800";
  if (type === "mention") return "bg-yellow-50 text-black";
  if (type === "message") return "bg-gray-100 text-gray-800";
  return "bg-gray-900 text-white";
}

export default function NotificationMenu({
  notifications,
  unreadCount,
  returnTo,
}: NotificationMenuProps) {
  return (
    <details className="group relative">
      <summary className="team-icon-button relative cursor-pointer list-none [&::-webkit-details-marker]:hidden" title="Notifications" aria-label={`${unreadCount} unread notifications`}>
        <Bell aria-hidden="true" size={18} />
        {unreadCount > 0 && <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-yellow-300 px-1 text-center text-[0.65rem] font-black leading-5 text-black">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </summary>

      <div className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_28px_80px_rgba(17,24,39,0.18)]">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <div>
            <p className="team-kicker">Workspace alerts</p>
            <h2 className="mt-1 text-base font-black text-black">Notifications</h2>
          </div>
          {unreadCount > 0 && (
            <form action={markAllNotificationsRead}>
              <input type="hidden" name="returnTo" value={returnTo} />
              <button type="submit" className="rounded-lg bg-gray-100 px-3 py-2 text-[0.65rem] font-black uppercase tracking-[0.12em] text-gray-700 transition hover:bg-gray-200">
                <CheckCheck aria-hidden="true" size={14} className="mr-1.5" /> Mark all read
              </button>
            </form>
          )}
        </div>

        <div className="max-h-[26rem] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-gray-500">No notifications</p>
              <p className="mt-2 text-sm font-bold text-gray-500">Task and chat alerts will appear here.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <article
                key={notification.id}
                className={`border-b border-gray-100 p-4 last:border-b-0 ${notification.read_at ? "bg-white" : "bg-indigo-50/55"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className={`rounded-full px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] ${notificationTone(notification.type)}`}>
                      {notification.type.replace("_", " ")}
                    </span>
                    <form action={openNotification} className="mt-3">
                      <input type="hidden" name="notificationId" value={notification.id} />
                      <button type="submit" className="block text-left text-sm font-black leading-5 text-black hover:text-indigo-700">
                        {notification.title}
                      </button>
                    </form>
                    {notification.body && (
                      <p className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-gray-500">
                        {notification.body}
                      </p>
                    )}
                    <p className="mt-2 text-xs font-bold text-gray-400">
                      {formatNotificationTime(notification.created_at)}
                    </p>
                  </div>
                  {!notification.read_at && (
                    <form action={markNotificationRead} className="shrink-0">
                      <input type="hidden" name="notificationId" value={notification.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button
                        type="submit"
                        className="rounded-md border border-indigo-200 bg-white px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-indigo-700 transition hover:bg-indigo-700 hover:text-white"
                      >
                        Read
                      </button>
                    </form>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        <Link href="/team/notifications" className="block border-t border-gray-200 bg-gray-50 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-indigo-700 transition hover:bg-indigo-50">
          View all notifications
        </Link>
      </div>
    </details>
  );
}
