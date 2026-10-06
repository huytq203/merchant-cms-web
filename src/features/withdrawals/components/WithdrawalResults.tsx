"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { Button } from "@/components/ui/button/Button";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import type { Withdrawal, WithdrawalListFilter, WithdrawalListResult } from "../types/types";
import { WithdrawalTable } from "./WithdrawalTable";

type Props = {
  list: UseQueryResult<WithdrawalListResult>;
  filter: WithdrawalListFilter;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (withdrawal: Withdrawal) => void;
};

/** The four data states of the list: loading, error, empty and data. */
export function WithdrawalResults({ list, filter, onPageChange, onView }: Props) {
  if (list.isPending) {
    return (
      <div role="status" aria-label="Đang tải danh sách yêu cầu rút tiền" className="space-y-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  if (list.isError) {
    return (
      <div role="alert" className="space-y-2">
        <p>{list.error.message}</p>
        <Button type="button" variant="ghost" onClick={() => void list.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }
  if (list.data.rows.length === 0) {
    return <p>Chưa có yêu cầu rút tiền</p>;
  }
  return (
    <WithdrawalTable
      rows={list.data.rows}
      total={list.data.total}
      page={filter.page}
      pageSize={filter.pageSize}
      onPageChange={onPageChange}
      onView={onView}
    />
  );
}
