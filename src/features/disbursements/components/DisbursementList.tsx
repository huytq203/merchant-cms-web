"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Eye } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createIndexColumn } from "@/components/page/IndexColumn";
import { Notice } from "@/components/page/Notice";
import { ResultCard } from "@/components/page/ResultCard";
import { ResultState } from "@/components/page/ResultState";
import { Button } from "@/components/ui/button/Button";
import { Table } from "@/components/ui/table/Table";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import { formatAmount } from "@/lib/utils/helper";
import { formatVnDateTime } from "@/lib/utils/vn-time";
import { bankDisplayName } from "@/features/bank-accounts/utils/bank-mapper";
import { disbursementQueries, downloadDisbursementsCsv } from "../disbursement-queries";
import type { OrderFilterValues, OrderItem, OrderListFilter } from "../types/types";
import { disbursementFailureReason } from "../utils/disbursement-failure-reason";
import { toOrderSearchParams } from "../utils/disbursement-filter-mapper";
import { channelLabel } from "../utils/disbursement-status";
import { DisbursementFilters } from "./DisbursementFilters";
import { DisbursementStatusBadge } from "./DisbursementStatusBadge";

type Props = {
  filter: OrderListFilter;
  /** Có quyền EXPORT_DISBURSEMENT: chỉ khi đó mới có nút Xuất CSV (BE kiểm lại). */
  canExport: boolean;
};

const EMPTY = "—";
const money = (value: number | null | undefined) => (value === null || value === undefined ? EMPTY : formatAmount(value));
const filterKey = (filter: OrderListFilter) => toOrderSearchParams({ ...filter, page: 1 }).toString();

function columns(subLabel: (id: string) => string, page: number, pageSize: number): ColumnDef<OrderItem>[] {
  return [
    createIndexColumn<OrderItem>({ page, pageSize }),
    {
      id: "code",
      header: "Mã yêu cầu",
      cell: ({ row }) => (
        <span className="font-mono font-semibold">{row.original.merchantRequestCode}</span>
      ),
    },
    { id: "sub", header: "Sub-merchant", cell: ({ row }) => <span>{subLabel(row.original.subId)}</span> },
    {
      id: "channel",
      header: "Hình thức",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span>{channelLabel(row.original.channel)}</span>
          {row.original.batchId ? (
            <p className="text-xs">
              <Link className="text-primary underline-offset-2 hover:underline" href={`/disbursements/batches/${row.original.batchId}`}>
                Xem lô
              </Link>
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "beneficiary",
      header: "Người thụ hưởng",
      cell: ({ row }) => {
        const beneficiary = row.original.beneficiary;
        return (
          <div className="space-y-0.5">
            <p className="font-medium">{beneficiary?.accountName ?? EMPTY}</p>
            <p className="text-xs text-muted-foreground">
              {beneficiary?.bankCode ? bankDisplayName(beneficiary.bankCode) : EMPTY}{" "}
              <span className="font-mono">{beneficiary?.accountMasked ?? ""}</span>
            </p>
          </div>
        );
      },
    },
    {
      id: "amount",
      header: "Số tiền",
      meta: { align: "right" },
      cell: ({ row }) => <span className="font-mono font-semibold tabular-nums">{formatAmount(row.original.amount)}</span>,
    },
    {
      id: "fees",
      header: "Phí MC / người nhận",
      meta: { align: "right" },
      cell: ({ row }) => <span className="font-mono tabular-nums">{`${money(row.original.merchantFee)} / ${money(row.original.receiverFee)}`}</span>,
    },
    {
      id: "debit",
      header: "Ghi nợ MC",
      meta: { align: "right" },
      cell: ({ row }) => <span className="font-mono tabular-nums">{money(row.original.debitAmount)}</span>,
    },
    {
      id: "payout",
      header: "Thực chi",
      meta: { align: "right" },
      // Thực chi chỉ có nghĩa khi tiền đã tới người nhận; lệnh chưa thành công để trống như thiết kế.
      cell: ({ row }) => <span className="font-mono tabular-nums">{row.original.status === "SUCCEEDED" ? money(row.original.payoutAmount) : EMPTY}</span>,
    },
    {
      id: "status",
      header: "Trạng thái",
      // Lệnh Thất bại / Đã hủy có mã lỗi thì hiện lý do tiếng Việt ngay dưới trạng thái (bảng dùng chung với màn chi tiết).
      cell: ({ row }) => {
        const failed = row.original.status === "FAILED" || row.original.status === "CANCELLED";
        const reason = failed ? disbursementFailureReason(row.original.failureCode) : null;
        return (
          <div className="space-y-1">
            <DisbursementStatusBadge status={row.original.status} fallbackLabel={row.original.statusLabel} />
            {reason ? <p className="max-w-56 text-xs text-muted-foreground">{reason}</p> : null}
          </div>
        );
      },
    },
    {
      id: "times",
      header: "Tạo / Thành công",
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs tabular-nums">
          <p>{formatVnDateTime(row.original.createdAt)}</p>
          <p className="text-muted-foreground">{row.original.status === "SUCCEEDED" ? formatVnDateTime(row.original.completedAt) : EMPTY}</p>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <span className="w-px whitespace-nowrap">Thao tác</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <Link
          className="inline-flex items-center gap-1 text-sm text-primary underline-offset-2 hover:underline"
          href={`/disbursements/orders/${row.original.operationId}`}
          aria-label={`Xem chi tiết lệnh ${row.original.merchantRequestCode}`}
        >
          <Eye size={16} aria-hidden /> Xem
        </Link>
      ),
    },
  ];
}

/**
 * Màn "Lịch sử chi hộ": bộ lọc, bảng lệnh phân trang và nút Xuất CSV (cùng bộ lọc đang hiện). Bộ lọc nằm trên URL nên
 * liên kết chia sẻ được và nút Back hoạt động; đổi bộ lọc luôn về trang 1. STK ở đây luôn đã che (BE che từ nguồn).
 */
export function DisbursementList({ filter, canExport }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const list = useQuery(disbursementQueries.orders(filter));
  const subs = useSubMerchantOptions();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const labels = useMemo(() => new Map((subs.data ?? []).map((sub) => [sub.id, `${sub.code} · ${sub.name}`])), [subs.data]);
  const subLabel = (id: string) => labels.get(id) ?? EMPTY;

  const navigate = (next: OrderListFilter) => router.push(`${pathname}?${toOrderSearchParams(next)}`);
  const search = (values: OrderFilterValues) => navigate({ page: 1, pageSize: filter.pageSize, ...values });

  const exportCsv = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await downloadDisbursementsCsv(filter);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Không xuất được file, vui lòng thử lại");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <DisbursementFilters key={filterKey(filter)} initial={filter} onSearch={search} />
      {canExport ? (
        <div className="flex justify-end">
          <Button type="button" variant="outline" isLoading={exporting} leftIcon={<Download size={16} aria-hidden />} onClick={() => void exportCsv()}>
            Xuất CSV
          </Button>
        </div>
      ) : null}
      {exportError ? <Notice tone="danger">{exportError}</Notice> : null}
      <ResultCard>
        {list.isPending ? <ResultState state="loading" /> : null}
        {list.isError ? <ResultState state="error" errorMessage={list.error.message} onRetry={() => void list.refetch()} /> : null}
        {list.data && list.data.items.length === 0 ? <ResultState state="empty" emptyMessage="Chưa có lệnh chi hộ nào khớp bộ lọc" /> : null}
        {list.data && list.data.items.length > 0 ? (
          <Table
            data={list.data.items}
            columns={columns(subLabel, filter.page, filter.pageSize)}
            labels={{ empty: "Chưa có lệnh chi hộ" }}
            pagination={{
              total: list.data.total,
              current: filter.page,
              pageSize: filter.pageSize,
              onChange: (page, pageSize) => navigate({ ...filter, page, pageSize }),
            }}
          />
        ) : null}
      </ResultCard>
    </div>
  );
}
