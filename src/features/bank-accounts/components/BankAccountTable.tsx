"use client";

import { useMemo } from "react";
import { Table } from "@/components/ui/table/Table";
import { getBankAccountColumns, type BankAccountColumnOptions } from "../columns/BankAccountColumn";
import type { BankAccount } from "../types";

type Props = BankAccountColumnOptions & {
  rows: BankAccount[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
};

export function BankAccountTable({ rows, total, page, pageSize, onPageChange, ...actions }: Props) {
  const { onView, onEdit, onSetDefault, onDelete } = actions;
  const columns = useMemo(
    () => getBankAccountColumns({ onView, onEdit, onSetDefault, onDelete }, page, pageSize),
    [onView, onEdit, onSetDefault, onDelete, page, pageSize],
  );
  return (
    <Table
      data={rows}
      columns={columns}
      labels={{ empty: "Chưa có tài khoản ngân hàng" }}
      pagination={{ total, current: page, pageSize, onChange: onPageChange }}
    />
  );
}
