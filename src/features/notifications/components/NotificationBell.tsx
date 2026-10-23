"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover/Popover";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { BELL_PREVIEW_SIZE, notificationQueries } from "../notification-queries";
import { useMarkRead } from "../hooks/use-notification-mutations";
import { useUnreadCount } from "../hooks/use-unread-count";
import { bellLabel, formatUnreadBadge } from "../utils/notification-format";
import type { Notification } from "../types";
import { NotificationItem } from "./NotificationItem";

const PREVIEW_FILTER = { unreadOnly: false, page: 1, pageSize: BELL_PREVIEW_SIZE } as const;

/**
 * Header bell: polls the unread count (see `notificationQueries.unreadCount`) and loads the five
 * latest rows only while the popover is open, as the BE handover recommends. Clicking a row marks it
 * read; the full inbox is one click away on `/notifications`.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { count } = useUnreadCount();
  const preview = useQuery({ ...notificationQueries.list(PREVIEW_FILTER), enabled: open });
  const markRead = useMarkRead();

  const select = (notification: Notification) => {
    if (notification.readAt === null) markRead.mutate(notification);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button type="button" variant="ghost" size="icon" aria-label={bellLabel(count)} className="relative shrink-0">
          <Bell className="size-5" aria-hidden="true" />
          {count > 0 ? (
            <span
              aria-hidden="true"
              className="absolute -top-0.5 -right-0.5 min-w-5 rounded-md bg-action px-1 text-center text-[10px] font-semibold leading-5 text-action-foreground tabular-nums"
            >
              {formatUnreadBadge(count)}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" showArrow={false} className="w-80 max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Thông báo</p>
          {count > 0 ? <p className="text-xs text-muted-foreground">{count} chưa đọc</p> : null}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {preview.isPending ? (
            <div role="status" aria-busy="true" aria-label="Đang tải thông báo" className="space-y-3 p-4">
              {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} variant="muted" className="h-12 w-full" />)}
            </div>
          ) : null}
          {preview.isError ? (
            <div role="alert" className="space-y-2 p-4 text-center">
              <p className="text-sm text-muted-foreground">Không tải được thông báo.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void preview.refetch()}>Thử lại</Button>
            </div>
          ) : null}
          {preview.data?.rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Bạn chưa có thông báo nào.</p>
          ) : null}
          {preview.data && preview.data.rows.length > 0 ? (
            <ul className="divide-y divide-border">
              {preview.data.rows.map((notification) => (
                <li key={notification.id}>
                  <NotificationItem notification={notification} onSelect={select} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="border-t border-border p-2">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block rounded-md px-2 py-1.5 text-center text-sm font-medium text-primary outline-none hover:bg-muted focus-visible:bg-muted"
          >
            Xem tất cả
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
