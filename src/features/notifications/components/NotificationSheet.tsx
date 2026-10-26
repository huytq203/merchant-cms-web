"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet/Sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs/Tabs";
import { useMarkAllNotificationsRead } from "../hooks/use-notification-mutations";
import { useUnreadCount } from "../hooks/use-unread-count";
import { NotificationList } from "./NotificationList";

interface NotificationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** The inbox of the signed-in user. The list mounts only while the sheet is open, so a closed sheet sends no list request. */
export function NotificationSheet({ open, onOpenChange }: NotificationSheetProps) {
  const [tab, setTab] = useState<"all" | "unread">("all");
  const unreadCount = useUnreadCount();
  const markAll = useMarkAllNotificationsRead();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-full">
        <SheetHeader>
          <SheetTitle>Thông báo</SheetTitle>
          <SheetDescription>Kết quả giao dịch và thay đổi liên quan đến tài khoản của bạn.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Tabs value={tab} onValueChange={(value) => setTab(value === "unread" ? "unread" : "all")}>
              <TabsList>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="unread">Chưa đọc</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              size="sm"
              disabled={unreadCount === 0}
              isLoading={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          </div>
          <NotificationList key={tab} unreadOnly={tab === "unread"} />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
