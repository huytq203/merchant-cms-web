"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { BellOff, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { useMarkNotificationRead } from "../hooks/use-notification-mutations";
import { notificationQueries } from "../notification-queries";
import { NotificationItem } from "./NotificationItem";

function ListSkeleton() {
  return (
    <div className="grid gap-2" role="status" aria-label="Đang tải thông báo">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex items-start gap-3 px-3 py-3">
          <Skeleton className="mt-1.5 h-2 w-2" rounded="full" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ListMessage({ icon, title, hint, action }: { icon: React.ReactNode; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span aria-hidden="true" className="text-muted-foreground">{icon}</span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      {action}
    </div>
  );
}

/** The paged list for one tab; `unreadOnly` is part of the query key, so each tab keeps its own pages. */
export function NotificationList({ unreadOnly }: { unreadOnly: boolean }) {
  const query = useInfiniteQuery(notificationQueries.list(unreadOnly));
  const markRead = useMarkNotificationRead();
  const rows = query.data?.pages.flatMap((page) => page.rows) ?? [];

  if (query.isPending) return <ListSkeleton />;
  if (query.isError) {
    return (
      <div role="alert">
        <ListMessage
          icon={<TriangleAlert className="h-6 w-6" />}
          title="Không tải được thông báo"
          hint="Kiểm tra kết nối rồi thử lại."
          action={<Button variant="outline" size="sm" onClick={() => void query.refetch()}>Thử lại</Button>}
        />
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <ListMessage
        icon={<BellOff className="h-6 w-6" />}
        title={unreadOnly ? "Không còn thông báo chưa đọc" : "Chưa có thông báo nào"}
        hint={unreadOnly ? undefined : "Thông báo về giao dịch sẽ xuất hiện ở đây."}
      />
    );
  }
  return (
    <div className="grid gap-1">
      {rows.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} onRead={markRead.mutate} />
      ))}
      {query.hasNextPage ? (
        <Button variant="ghost" size="sm" className="mt-2 justify-self-center" isLoading={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
          Tải thêm
        </Button>
      ) : null}
    </div>
  );
}
