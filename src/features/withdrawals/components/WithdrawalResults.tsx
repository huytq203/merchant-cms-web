"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { ResultCard } from "@/components/page/ResultCard";
import { ResultState } from "@/components/page/ResultState";
import type { Withdrawal, WithdrawalListFilter, WithdrawalListResult } from "../types/types";
import { WithdrawalTable } from "./WithdrawalTable";

type Props = {
  list: UseQueryResult<WithdrawalListResult>;
  filter: WithdrawalListFilter;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (withdrawal: Withdrawal) => void;
};

export function WithdrawalResults({ list, filter, onPageChange, onView }: Props) {
  return (
    <ResultCard subject="yêu cầu rút tiền" total={list.data?.total ?? 0}>
      {list.isPending ? <ResultState state="loading" /> : null}
      {list.isError ? <ResultState state="error" errorMessage={list.error.message} onRetry={() => void list.refetch()} /> : null}
      {list.data?.rows.length === 0 ? <ResultState state="empty" emptyMessage="Chưa có yêu cầu rút tiền" /> : null}
      {list.data?.rows.length ? (
        <WithdrawalTable
          rows={list.data.rows}
          total={list.data.total}
          page={filter.page}
          pageSize={filter.pageSize}
          onPageChange={onPageChange}
          onView={onView}
        />
      ) : null}
    </ResultCard>
  );
}
