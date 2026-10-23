"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCheck } from "lucide-react";
import { PageHeader } from "@/components/page/PageHeader";
import { ResultCard } from "@/components/page/ResultCard";
import { ResultState } from "@/components/page/ResultState";
import { Button } from "@/components/ui/button/Button";
import { Table } from "@/components/ui/table/Table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs/Tabs";
import { notificationColumns } from "../columns/NotificationColumn";
import { useMarkAllRead, useMarkRead } from "../hooks/use-notification-mutations";
import { useNotificationNavigation } from "../hooks/use-notification-navigation";
import { useUnreadCount } from "../hooks/use-unread-count";
import { notificationQueries } from "../notification-queries";
import type { NotificationFilter } from "../types";

interface Props {
  filter: NotificationFilter;
}

const ALL = "all";
const UNREAD = "unread";

/**
 * `/notifications` inbox: "Tất cả / Chưa đọc" tabs driven by the URL, a paginated table, per-row
 * mark-read and one page-level "mark all read" (disabled when nothing is unread).
 */
export function NotificationList({ filter }: Props) {
  const navigation = useNotificationNavigation(filter);
  const list = useQuery(notificationQueries.list(filter));
  const { count } = useUnreadCount();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const tab = filter.unreadOnly ? UNREAD : ALL;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Thông báo"
        description="Thông báo gửi tới tài khoản của bạn, mới nhất ở trên cùng."
        action={(
          <Button
            type="button"
            variant="outline"
            leftIcon={<CheckCheck className="size-4" aria-hidden="true" />}
            disabled={count === 0}
            isLoading={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      />
      <Tabs value={tab} onValueChange={(value) => navigation.setUnreadOnly(value === UNREAD)}>
        <TabsList aria-label="Lọc thông báo">
          <TabsTrigger value={ALL}>Tất cả</TabsTrigger>
          <TabsTrigger value={UNREAD}>Chưa đọc</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <ResultCard>
            {list.isPending ? <ResultState state="loading" loadingLabel="Đang tải thông báo" /> : null}
            {list.isError ? (
              <ResultState state="error" errorMessage={list.error.message} onRetry={() => void list.refetch()} />
            ) : null}
            {list.data?.rows.length === 0 ? (
              <ResultState
                state="empty"
                emptyMessage={filter.unreadOnly ? "Không có thông báo chưa đọc." : "Bạn chưa có thông báo nào."}
              />
            ) : null}
            {list.data && list.data.rows.length > 0 ? (
              <div className="max-w-full overflow-x-auto">
                <Table
                  data={list.data.rows}
                  columns={notificationColumns((row) => markRead.mutate(row))}
                  labels={{ empty: "Không có thông báo" }}
                  pagination={{
                    total: list.data.total,
                    current: filter.page,
                    pageSize: filter.pageSize,
                    pageSizeOptions: [10, 20, 50, 100],
                    onChange: navigation.changePage,
                  }}
                />
              </div>
            ) : null}
          </ResultCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
