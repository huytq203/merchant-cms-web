"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { Button } from "@/components/ui/button/Button";
import { BankAccountTable } from "./BankAccountTable";
import type { BankAccountColumnOptions } from "../columns/BankAccountColumn";
import type { BankAccountList } from "../types";

type Props = BankAccountColumnOptions & {
  list: UseQueryResult<BankAccountList>;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
};

/** Loading, error, empty and data states of the result card. */
export function BankAccountResults({ list, page, pageSize, onPageChange, ...actions }: Props) {
  if (list.isPending) return <p>Đang tải danh sách tài khoản ngân hàng...</p>;
  if (list.isError) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3">
        <p>{list.error.message}</p>
        <Button type="button" variant="outline" onClick={() => void list.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }
  if (list.data.rows.length === 0) return <p>Chưa có tài khoản ngân hàng</p>;
  return (
    <BankAccountTable
      rows={list.data.rows}
      total={list.data.total}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      {...actions}
    />
  );
}
