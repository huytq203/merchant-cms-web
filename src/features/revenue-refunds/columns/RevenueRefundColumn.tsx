import type { ColumnDef } from "@tanstack/react-table";
import { Ban, ShieldCheck } from "lucide-react";
import { RowActions } from "@/components/page/RowActions";
import { StatusBadge } from "@/components/page/StatusBadge";
import { formatVnDateTime } from "@/lib/utils/vn-time";
import { PAYOUT_STATUS_LABEL, REFUND_STATUS } from "../constants/refund-status";
import type { RevenueRefund } from "../types";

interface Options {
  /** Left out without APPROVE_REFUND, which removes the action column. */
  onApprove?: (refund: RevenueRefund) => void;
  /** Hủy yêu cầu đang Chờ phê duyệt (người tạo hoặc người có quyền duyệt; BE kiểm tiếp). */
  onCancel?: (refund: RevenueRefund) => void;
  /** Quyết định theo từng dòng: yêu cầu do Portal tạo, và quyền hủy của phiên (xem `canCancelRefund`). */
  canCancel?: (refund: RevenueRefund) => boolean;
  /** Tên Sub dự phòng khi dòng chưa mang `subMerchantName`. */
  subNames: Record<string, string>;
}

const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value);

export function revenueRefundColumns({ onApprove, onCancel, canCancel, subNames }: Options): ColumnDef<RevenueRefund>[] {
  const columns: ColumnDef<RevenueRefund>[] = [
    {
      id: "refund",
      header: "Mã hoàn tiền",
      cell: ({ row }) => (
        <div className="min-w-[200px] max-w-[280px]">
          <div className="font-semibold">{row.original.refundCode}</div>
          <div className="truncate text-sm text-muted-foreground">{row.original.reason}</div>
        </div>
      ),
    },
    {
      // Mã đơn hàng ở dòng chính, mã giao dịch (FM…) ở dòng phụ (thuật ngữ chốt 10/11/2026).
      id: "order",
      header: "Mã đơn hàng",
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <div className="font-semibold">{row.original.orderCode ?? "—"}</div>
          {row.original.transactionCode ? <div className="font-mono text-sm text-muted-foreground">{row.original.transactionCode}</div> : null}
        </div>
      ),
    },
    {
      id: "sub",
      header: "Sub-merchant",
      cell: ({ row }) => (
        <div className="min-w-[140px]">
          <div>{row.original.subMerchantName ?? subNames[row.original.subMerchantId] ?? "Sub-merchant"}</div>
          {row.original.terminalCode ? <div className="text-sm text-muted-foreground">{row.original.terminalCode}</div> : null}
        </div>
      ),
    },
    {
      id: "amount",
      header: "Số tiền hoàn",
      meta: { align: "right" },
      cell: ({ row }) => (
        <div className="text-right">
          <div className="font-semibold tabular-nums">{money(row.original.amount)}</div>
          <div className="text-sm text-muted-foreground">{row.original.fullRefund ? "Toàn phần" : "Một phần"}</div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = REFUND_STATUS[row.original.status];
        return (
          <div className="min-w-[170px] max-w-[240px] space-y-1">
            <StatusBadge label={status.label} tone={status.tone} />
            {status.next ? <div className="text-sm text-muted-foreground">{status.next}</div> : null}
          </div>
        );
      },
    },
    {
      id: "payout",
      header: "Chi tiền cho khách",
      cell: ({ row }) => (row.original.payoutStatus ? PAYOUT_STATUS_LABEL[row.original.payoutStatus] : "—"),
    },
    { id: "createdAt", header: "Tạo lúc", cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{formatVnDateTime(row.original.createdAt)}</span> },
  ];
  if (!onApprove && !onCancel) return columns;
  return [
    ...columns,
    {
      id: "actions",
      header: () => <span className="sr-only">Thao tác</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const pending = row.original.status === "PENDING_APPROVAL";
        return (
          <RowActions
            subject={row.original.refundCode}
            actions={[
              {
                label: "Phê duyệt",
                icon: <ShieldCheck size={16} />,
                visible: Boolean(onApprove),
                disabled: !pending,
                disabledReason: "Chỉ duyệt được yêu cầu đang chờ phê duyệt",
                onClick: () => onApprove?.(row.original),
              },
              // Chỉ hiện trên dòng Chờ phê duyệt: các trạng thái khác không còn hủy được.
              { label: "Hủy yêu cầu", icon: <Ban size={16} />, visible: Boolean(onCancel) && pending && (canCancel?.(row.original) ?? true), onClick: () => onCancel?.(row.original) },
            ]}
          />
        );
      },
    },
  ];
}
