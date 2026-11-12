"use client";

import { useState, type ReactNode } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { useUnreadCount } from "../hooks/use-unread-count";
import { NotificationSheet } from "./NotificationSheet";

const MAX_BADGE_COUNT = 99;

/** Chuông trên header: huy hiệu số chưa đọc (quá 99 hiện "99+") và mở hộp thư. */
export function NotificationBell({ pushSlot }: { pushSlot?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const unreadCount = useUnreadCount();
  const shown = unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : String(unreadCount);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={unreadCount > 0 ? `Thông báo, ${shown} chưa đọc` : "Thông báo"}
        onClick={() => setOpen(true)}
        className="relative shrink-0"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] font-semibold leading-4 tabular-nums text-primary-foreground"
          >
            {shown}
          </span>
        ) : null}
      </Button>
      <NotificationSheet open={open} onOpenChange={setOpen} pushSlot={pushSlot} />
    </>
  );
}
