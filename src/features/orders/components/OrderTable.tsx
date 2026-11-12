"use client";

import { Table } from "@/components/ui/table/Table";
import { getOrderColumns, type OrderColumnActions } from "../columns/Order.column";
import type { Order } from "../types/types";

type Props = OrderColumnActions & {
  rows: Order[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
};

export function OrderTable(props: Props) {
  const { rows, total, page, pageSize, onPageChange, onView, onViewQr, onCustomerDisplay, onCancel, onRefund, onDispute } = props;
  const columns = getOrderColumns({ onView, onViewQr, onCustomerDisplay, onCancel, onRefund, onDispute }, page, pageSize);
  return (
    <Table
      data={rows}
      columns={columns}
      labels={{ empty: "Không có đơn hàng" }}
      pagination={{ total, current: page, pageSize, onChange: onPageChange }}
    />
  );
}
