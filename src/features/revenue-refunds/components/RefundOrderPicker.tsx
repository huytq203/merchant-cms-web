"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ResultState } from "@/components/page/ResultState";
import { Button } from "@/components/ui/button/Button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { Input } from "@/components/ui";
import { Table } from "@/components/ui/table/Table";
import { orderQueries } from "@/features/orders/order-queries";
import type { Order } from "@/features/orders/types/types";
import { formatAmount } from "@/lib/utils/helper";
import type { RefundOrder } from "./RefundCreateDialog";

const PAGE_SIZE = 10;

interface Props {
  onPick: (order: RefundOrder) => void;
  onClose: () => void;
}

function columns(onPick: (row: Order) => void): ColumnDef<Order>[] {
  return [
    {
      id: "code",
      header: "Đơn hàng",
      cell: ({ row }) => (
        <div>
          <p className="font-mono text-sm font-semibold">{row.original.orderCode}</p>
          {row.original.transactionCode ? <p className="font-mono text-xs text-muted-foreground">{row.original.transactionCode}</p> : null}
        </div>
      ),
    },
    { id: "sub", header: "Sub-merchant", cell: ({ row }) => row.original.subMerchantName ?? "—" },
    {
      id: "amount",
      header: "Số tiền",
      meta: { align: "right" },
      cell: ({ row }) => <span className="whitespace-nowrap font-mono tabular-nums">{formatAmount(row.original.amount)}</span>,
    },
    {
      id: "pick",
      header: "",
      meta: { align: "right" },
      cell: ({ row }) => (
        <Button type="button" variant="outline" size="sm" aria-label={`Chọn đơn hàng ${row.original.orderCode}`} onClick={() => onPick(row.original)}>
          Chọn
        </Button>
      ),
    },
  ];
}

/**
 * Bước đầu của hoàn tiền mở từ trang hoàn tiền: chọn một đơn hàng đã thanh toán thành công của phiên
 * (chỉ đơn đã thanh toán mới hoàn được). Đọc danh sách đơn hàng nên cần VIEW_ORDER; số tiền còn hoàn được
 * do BE kiểm khi tạo yêu cầu.
 */
export function RefundOrderPicker({ onPick, onClose }: Props) {
  const [draft, setDraft] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const list = useQuery(
    orderQueries.list({ page, pageSize: PAGE_SIZE, status: "SUCCESS", ...(keyword ? { orderCode: keyword } : {}) }),
  );
  const pick = (row: Order) =>
    onPick({ id: row.id, orderCode: row.orderCode, amount: row.amount, subMerchantName: row.subMerchantName });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Chọn đơn hàng cần hoàn tiền</DialogTitle>
          <DialogDescription>Chỉ đơn hàng đã thanh toán thành công mới hoàn được.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setKeyword(draft.trim());
            }}
          >
            <div className="flex-1">
              <Input label="Tìm đơn hàng" placeholder="Mã đơn hàng" value={draft} onChange={(event) => setDraft(event.target.value)} />
            </div>
            <Button type="submit" variant="outline">Tìm</Button>
          </form>
          {list.isPending ? <ResultState state="loading" loadingLabel="Đang tải đơn hàng" /> : null}
          {list.isError ? <ResultState state="error" errorMessage={list.error.message} onRetry={() => void list.refetch()} /> : null}
          {list.data?.rows.length === 0 ? <ResultState state="empty" emptyMessage="Không có đơn hàng thanh toán thành công nào phù hợp." /> : null}
          {list.data && list.data.rows.length > 0 ? (
            <Table
              data={list.data.rows}
              columns={columns(pick)}
              pagination={{ total: list.data.total, current: page, pageSize: PAGE_SIZE, onChange: (next) => setPage(next) }}
            />
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
