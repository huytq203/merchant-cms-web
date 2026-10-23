"use client";

import { cn } from "@/lib/utils/cn";
import { formatVnDateTime } from "@/lib/utils/vn-time";
import type { Notification } from "../types";

interface Props {
  notification: Notification;
  onSelect: (notification: Notification) => void;
}

/**
 * One row of the bell preview. Unread rows carry a teal dot and a bolder title, plus a screen-reader
 * "Chưa đọc" so the state is never conveyed by colour alone. Times are shown in Vietnam time.
 */
export function NotificationItem({ notification, onSelect }: Props) {
  const unread = notification.readAt === null;
  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className="flex w-full gap-3 px-4 py-3 text-left outline-none motion-safe:transition-colors hover:bg-muted focus-visible:bg-muted"
    >
      <span aria-hidden="true" className={cn("mt-1.5 size-2 shrink-0 rounded-full", unread ? "bg-primary" : "bg-transparent")} />
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className={cn("block truncate text-sm text-foreground", unread && "font-semibold")} title={notification.title}>
          {notification.title}
        </span>
        <span className="line-clamp-2 block text-xs text-muted-foreground">{notification.body}</span>
        <time className="block text-xs text-muted-foreground tabular-nums" dateTime={notification.createdAt}>
          {formatVnDateTime(notification.createdAt)}
        </time>
        {unread ? <span className="sr-only">Chưa đọc</span> : null}
      </span>
    </button>
  );
}
