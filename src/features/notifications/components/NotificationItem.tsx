import { cn } from "@/lib/utils/cn";
import { formatNotificationTime } from "../utils/format-time";
import type { Notification } from "../types";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

/** One row. Unread is a dot plus a heavier title plus a screen-reader label, so it never rests on color alone. */
export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const unread = notification.readAt === null;
  return (
    <button
      type="button"
      onClick={() => unread && onRead(notification.id)}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left outline-none motion-safe:transition-colors",
        "hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
        unread ? "bg-secondary/40" : "bg-transparent",
      )}
    >
      <span aria-hidden="true" className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", unread ? "bg-primary" : "bg-transparent")} />
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className={cn("text-sm text-foreground", unread ? "font-semibold" : "font-medium")}>{notification.title}</span>
        {notification.body ? <span className="line-clamp-2 text-sm text-muted-foreground">{notification.body}</span> : null}
        <time dateTime={notification.createdAt} className="text-xs text-muted-foreground">
          {formatNotificationTime(notification.createdAt)}
        </time>
      </span>
      {unread ? <span className="sr-only">Chưa đọc</span> : null}
    </button>
  );
}
