"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ResultState } from "@/components/page/ResultState";
import { Button } from "@/components/ui/button/Button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { Input } from "@/components/ui";
import { Table } from "@/components/ui/table/Table";
import { transactionQueries } from "@/features/transactions/transaction-queries";
import type { Transaction } from "@/features/transactions/types";
import { formatAmount } from "@/lib/utils/helper";
import type { RefundOrder } from "./RefundCreateDialog";

const PAGE_SIZE = 10;

interface Props {
  onPick: (order: RefundOrder) => void;
  onClose: () => void;
}

const codeOf = (row: Transaction) => row.transactionCode ?? row.orderCode;

function columns(onPick: (row: Transaction) => void): ColumnDef<Transaction>[] {
  return [
    {
      id: "code",
      header: "Giao dịch",
      cell: ({ row }) => (
        <div>
          <p className="font-mono text-sm font-semibold">{codeOf(row.original)}</p>
          <p className="font-mono text-xs text-muted-foreground">{row.original.orderCode}</p>
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
        <Button type="button" variant="outline" size="sm" aria-label={`Chọn giao dịch ${codeOf(row.original)}`} onClick={() => onPick(row.original)}>
          Chọn
        </Button>
      ),
    },
  ];
}

/**
 * First step of a refund started from the refund page: pick one of the session's successful transactions
 * (only a paid order can be refunded). Reads the transaction list, so it needs VIEW_TRANSACTION; how much
 * may still be refunded is checked by the BE when the request is made.
 */
export function RefundOrderPicker({ onPick, onClose }: Props) {
  const [draft, setDraft] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const list = useQuery(
    transactionQueries.list({ page, pageSize: PAGE_SIZE, status: "SUCCESS", ...(keyword ? { keyword } : {}) }),
  );
  const pick = (row: Transaction) =>
    onPick({ id: row.id, orderCode: row.orderCode, amount: row.amount, subMerchantName: row.subMerchantName });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Chọn giao dịch cần hoàn tiền</DialogTitle>
          <DialogDescription>Chỉ giao dịch thanh toán thành công mới hoàn được.</DialogDescription>
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
              <Input label="Tìm giao dịch" placeholder="Mã giao dịch, mã đơn, tên Sub-merchant" value={draft} onChange={(event) => setDraft(event.target.value)} />
            </div>
            <Button type="submit" variant="outline">Tìm</Button>
          </form>
          {list.isPending ? <ResultState state="loading" loadingLabel="Đang tải giao dịch" /> : null}
          {list.isError ? <ResultState state="error" errorMessage={list.error.message} onRetry={() => void list.refetch()} /> : null}
          {list.data?.rows.length === 0 ? <ResultState state="empty" emptyMessage="Không có giao dịch thành công nào phù hợp." /> : null}
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
