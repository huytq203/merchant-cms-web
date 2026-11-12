"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button/Button";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet/Sheet";
import { Switch } from "@/components/ui/switch/Switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs/Tabs";
import { useMarkAllNotificationsRead, useMarkNotificationRead } from "../hooks/use-notification-mutations";
import { useUnreadSummary } from "../hooks/use-unread-count";
import type { Notification, NotificationCategory, UnreadCount } from "../types";
import { notificationHref } from "../utils/notification-href";
import { NotificationList } from "./NotificationList";

type TabValue = "ALL" | NotificationCategory;

/** Bốn tab theo thứ tự hiển thị; "Tất cả" không gửi `category`. */
const TABS: { value: TabValue; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "PAYMENT", label: "Thanh toán" },
  { value: "WITHDRAWAL", label: "Rút tiền" },
  { value: "OTHER", label: "Khác" },
];

const MAX_BADGE_COUNT = 99;

/** Số chưa đọc của tab: "Tất cả" dùng tổng, các tab còn lại dùng `byCategory`. */
function tabCount(tab: TabValue, summary: UnreadCount): number {
  return tab === "ALL" ? summary.count : summary.byCategory[tab];
}

interface NotificationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chỗ dành cho nút "Bật thông báo trên trình duyệt" (Task 22); để trống thì không hiện gì. */
  pushSlot?: ReactNode;
}

/** The inbox of the signed-in user. The list mounts only while the sheet is open, so a closed sheet sends no list request. */
export function NotificationSheet({ open, onOpenChange, pushSlot }: NotificationSheetProps) {
  const router = useRouter();
  const [tab, setTab] = useState<TabValue>("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const summary = useUnreadSummary();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const category = tab === "ALL" ? undefined : tab;

  /** Đánh dấu đã đọc (nếu chưa), đóng hộp thư rồi mở trang đích; thông báo không có đích chỉ được đánh dấu đã đọc. */
  function openNotification(notification: Notification) {
    if (notification.readAt === null) markRead.mutate(notification.id);
    onOpenChange(false);
    const href = notificationHref(notification);
    if (href) router.push(href);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-full">
        <SheetHeader>
          <SheetTitle>Thông báo</SheetTitle>
          <SheetDescription>Kết quả giao dịch và thay đổi liên quan đến tài khoản của bạn.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          {pushSlot ? <div className="mb-3">{pushSlot}</div> : null}
          <Tabs value={tab} onValueChange={(value) => setTab(value as TabValue)} className="mb-3">
            <TabsList className="max-w-full overflow-x-auto">
              {TABS.map(({ value, label }) => {
                const count = tabCount(value, summary);
                return (
                  <TabsTrigger key={value} value={value} className="gap-1.5">
                    {label}
                    {count > 0 ? (
                      <span className="rounded-full bg-primary/10 px-1.5 text-xs font-semibold tabular-nums text-primary">
                        {count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : count}
                        <span className="sr-only"> chưa đọc</span>
                      </span>
                    ) : null}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Switch size="sm" label="Chỉ chưa đọc" checked={unreadOnly} onCheckedChange={setUnreadOnly} />
            <Button
              variant="outline"
              size="sm"
              disabled={tabCount(tab, summary) === 0}
              isLoading={markAll.isPending}
              onClick={() => markAll.mutate(category)}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          </div>
          <NotificationList key={`${tab}:${unreadOnly}`} unreadOnly={unreadOnly} category={category} onOpen={openNotification} />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
