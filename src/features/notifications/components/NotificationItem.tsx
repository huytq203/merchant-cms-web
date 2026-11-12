import { Banknote, Bell, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatNotificationTime } from "../utils/format-time";
import type { Notification, NotificationCategory } from "../types";

interface NotificationItemProps {
  notification: Notification;
  /** Bấm dòng: cha đánh dấu đã đọc, đóng hộp thư và mở trang đích. */
  onOpen: (notification: Notification) => void;
}

const CATEGORY_ICON: Record<NotificationCategory, typeof Bell> = {
  PAYMENT: CreditCard,
  WITHDRAWAL: Banknote,
  OTHER: Bell,
};

/** One row. Unread is a dot plus a heavier title plus a screen-reader label, so it never rests on color alone. */
export function NotificationItem({ notification, onOpen }: NotificationItemProps) {
  const unread = notification.readAt === null;
  const Icon = CATEGORY_ICON[notification.category];
  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left outline-none motion-safe:transition-colors",
        "hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
        unread ? "bg-secondary/40" : "bg-transparent",
      )}
    >
      <span aria-hidden="true" className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", unread ? "bg-primary" : "bg-transparent")} />
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
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
