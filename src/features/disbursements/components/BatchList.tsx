"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { FilterCard } from "@/components/page/FilterCard";
import { createIndexColumn } from "@/components/page/IndexColumn";
import { Notice } from "@/components/page/Notice";
import { ResultCard } from "@/components/page/ResultCard";
import { ResultState } from "@/components/page/ResultState";
import { StatusBadge } from "@/components/page/StatusBadge";
import { Select } from "@/components/ui/select/Select";
import { Table } from "@/components/ui/table/Table";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import { formatAmount } from "@/lib/utils/helper";
import { formatVnDateTime } from "@/lib/utils/vn-time";
import { disbursementQueries } from "../disbursement-queries";
import type { BatchListFilter, BatchListItem } from "../types/types";
import { batchStatusLabel } from "../utils/disbursement-mapper";
import { batchProgress, batchStatusTone } from "../utils/disbursement-status";
import { BatchProgressBar } from "./BatchProgressBar";

type Props = { filter: BatchListFilter };

const EMPTY = "—";
/** Trạng thái của lô (không phải của lệnh): chờ gửi, đang gửi, đã gửi xong, hết hạn. */
const BATCH_STATUS_OPTIONS = ["DRAFT", "SUBMITTING", "COMPLETED", "EXPIRED"].map((value) => ({ value, label: batchStatusLabel(value) }));

function toParams(filter: BatchListFilter): URLSearchParams {
  const params = new URLSearchParams({ page: String(filter.page), pageSize: String(filter.pageSize) });
  if (filter.subId) params.set("subId", filter.subId);
  if (filter.status) params.set("status", filter.status);
  return params;
}

function columns(subLabel: (id: string) => string, page: number, pageSize: number): ColumnDef<BatchListItem>[] {
  return [
    createIndexColumn<BatchListItem>({ page, pageSize }),
    {
      id: "code",
      header: "Mã lô",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-mono font-semibold">{row.original.batch.batchCode}</span>
          <p className="text-xs text-muted-foreground">{row.original.batch.fileName ?? EMPTY}</p>
        </div>
      ),
    },
    { id: "sub", header: "Sub-merchant", cell: ({ row }) => <span>{subLabel(row.original.batch.subId)}</span> },
    {
      id: "rows",
      header: "Dòng (tổng / hợp lệ / lỗi)",
      meta: { align: "right" },
      cell: ({ row }) => <span className="tabular-nums">{`${row.original.batch.totalRows} / ${row.original.batch.validRows} / ${row.original.batch.invalidRows}`}</span>,
    },
    {
      id: "amount",
      header: "Tổng tiền hợp lệ",
      meta: { align: "right" },
      cell: ({ row }) => <span className="font-mono tabular-nums">{formatAmount(row.original.batch.totalAmount)}</span>,
    },
    {
      id: "status",
      header: "Trạng thái lô",
      cell: ({ row }) => <StatusBadge label={batchStatusLabel(row.original.batch.status)} tone={batchStatusTone(row.original.batch.status)} />,
    },
    {
      id: "progress",
      header: "Tiến độ chi",
      cell: ({ row }) => {
        // Lô chưa gửi / chưa có lệnh / chưa đọc được tiến độ thì không có thanh, chỉ dấu gạch.
        const summary = row.original.summary;
        if (!summary || summary.orderCount === 0) return <span className="text-muted-foreground">{EMPTY}</span>;
        const progress = batchProgress(summary);
        return (
          <div className="min-w-40 space-y-1">
            <BatchProgressBar progress={progress} label={`Tiến độ lô ${row.original.batch.batchCode}`} />
            <p className="text-xs text-muted-foreground">{`${progress.finished}/${progress.total} lệnh đã có kết quả`}</p>
          </div>
        );
      },
    },
    { id: "createdAt", header: "Tạo lúc", cell: ({ row }) => <span className="text-xs tabular-nums">{formatVnDateTime(row.original.batch.createdAt)}</span> },
    {
      id: "actions",
      header: () => <span className="w-px whitespace-nowrap">Thao tác</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <Link
          className="inline-flex items-center gap-1 text-sm text-primary underline-offset-2 hover:underline"
          href={`/disbursements/batches/${row.original.batch.batchId}`}
          aria-label={`Xem lô ${row.original.batch.batchCode}`}
        >
          <Eye size={16} aria-hidden /> Xem
        </Link>
      ),
    },
  ];
}

/**
 * Màn "Lô chi hộ": mã lô, tổng/hợp lệ/lỗi, tổng tiền, trạng thái lô và tiến độ chi (lệnh đã có kết quả trên tổng). Lọc theo
 * Sub (chỉ Sub trong phạm vi của người dùng) và trạng thái lô; bộ lọc nằm trên URL.
 */
export function BatchList({ filter }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const list = useQuery(disbursementQueries.batches(filter));
  const subs = useSubMerchantOptions();
  const [subId, setSubId] = useState(filter.subId ?? "");
  const [status, setStatus] = useState(filter.status ?? "");

  const labels = useMemo(() => new Map((subs.data ?? []).map((sub) => [sub.id, `${sub.code} · ${sub.name}`])), [subs.data]);
  const subLabel = (id: string) => labels.get(id) ?? EMPTY;
  const subOptions = (subs.data ?? []).map((sub) => ({ value: sub.id, label: `${sub.code} · ${sub.name}` }));

  const navigate = (next: BatchListFilter) => router.push(`${pathname}?${toParams(next)}`);
  const search = () => navigate({ page: 1, pageSize: filter.pageSize, ...(subId ? { subId } : {}), ...(status ? { status } : {}) });
  const clear = () => {
    setSubId("");
    setStatus("");
    navigate({ page: 1, pageSize: filter.pageSize });
  };

  return (
    <div className="space-y-4">
      <FilterCard fieldCount={2} onSubmit={search} onClear={clear}>
        <Select label="Sub-merchant" value={subId} onChange={setSubId} options={subOptions} placeholder="Tất cả Sub-merchant" />
        <Select label="Trạng thái lô" value={status} onChange={setStatus} options={BATCH_STATUS_OPTIONS} placeholder="Tất cả trạng thái" />
      </FilterCard>
      {list.data?.summaryUnavailable ? (
        <Notice tone="warning">Chưa đọc được tiến độ chi của các lô, danh sách lô vẫn hiển thị. Vui lòng tải lại sau ít phút.</Notice>
      ) : null}
      <ResultCard>
        {list.isPending ? <ResultState state="loading" /> : null}
        {list.isError ? <ResultState state="error" errorMessage={list.error.message} onRetry={() => void list.refetch()} /> : null}
        {list.data && list.data.items.length === 0 ? <ResultState state="empty" emptyMessage="Chưa có lô chi hộ nào" /> : null}
        {list.data && list.data.items.length > 0 ? (
          <Table
            data={list.data.items}
            columns={columns(subLabel, filter.page, filter.pageSize)}
            labels={{ empty: "Chưa có lô chi hộ" }}
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
