"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { ResultCard } from "@/components/page/ResultCard";
import { ResultState } from "@/components/page/ResultState";
import { BankAccountTable } from "./BankAccountTable";
import type { BankAccountColumnOptions } from "../columns/BankAccountColumn";
import type { BankAccountList } from "../types";

type Props = BankAccountColumnOptions & {
  list: UseQueryResult<BankAccountList>;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
};

export function BankAccountResults({ list, page, pageSize, onPageChange, ...actions }: Props) {
  return (
    <ResultCard subject="tài khoản ngân hàng" total={list.data?.total ?? 0}>
      {list.isPending ? <ResultState state="loading" /> : null}
      {list.isError ? <ResultState state="error" errorMessage={list.error.message} onRetry={() => void list.refetch()} /> : null}
      {list.data?.rows.length === 0 ? <ResultState state="empty" emptyMessage="Chưa có tài khoản ngân hàng" /> : null}
      {list.data?.rows.length ? (
        <BankAccountTable
          rows={list.data.rows}
          total={list.data.total}
          page={page}
          pageSize={pageSize}
          onPageChange={onPageChange}
          {...actions}
        />
      ) : null}
    </ResultCard>
  );
}
