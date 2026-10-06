"use client";

import { Table } from "@/components/ui/table/Table";
import { getWithdrawalColumns } from "../columns/Withdrawal.column";
import type { Withdrawal } from "../types/types";

type Props = {
  rows: Withdrawal[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (withdrawal: Withdrawal) => void;
};

export function WithdrawalTable({ rows, total, page, pageSize, onPageChange, onView }: Props) {
  const columns = getWithdrawalColumns({ onView });
  return (
    <Table
      data={rows}
      columns={columns}
      labels={{ empty: "Chưa có yêu cầu rút tiền" }}
      pagination={{ total, current: page, pageSize, onChange: onPageChange }}
    />
  );
}
