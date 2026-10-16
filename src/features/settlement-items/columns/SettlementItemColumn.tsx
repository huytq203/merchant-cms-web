import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { createIndexColumn } from "@/components/page/IndexColumn";
import { RowActions } from "@/components/page/RowActions";
import { StatusBadge } from "@/components/page/StatusBadge";
import { formatVnDate, formatVnDateTime } from "@/lib/utils/vn-time";
import { LINE_STATUS } from "../constants/settlement-labels";
import type { SettlementItem, SettlementLineStatus } from "../types";

const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value);

function Tranche({ amount, status, note }: { amount: number; status: SettlementLineStatus | null; note?: string }) {
  if (!status) return <span className="text-sm text-muted-foreground">Không tạm giữ</span>;
  return (
    <div className="space-y-1">
      <div className="tabular-nums">{money(amount)}</div>
      <StatusBadge label={LINE_STATUS[status].label} tone={LINE_STATUS[status].tone} />
      {note ? <div className="text-xs text-muted-foreground">{note}</div> : null}
    </div>
  );
}

const amountColumn = (id: keyof SettlementItem, header: string): ColumnDef<SettlementItem> => ({
  id,
  header,
  meta: { align: "right" },
  cell: ({ row }) => <span className="tabular-nums">{money(row.original[id] as number)}</span>,
});

export function settlementItemColumns(onView: (row: SettlementItem) => void, page: number, pageSize: number): ColumnDef<SettlementItem>[] {
  return [
    createIndexColumn<SettlementItem>({ page, pageSize }),
    { id: "orderCode", header: "Mã giao dịch", cell: ({ row }) => <span className="font-semibold">{row.original.orderCode}</span> },
    { id: "paidAt", header: "Thanh toán lúc", cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{formatVnDateTime(row.original.paidAt)}</span> },
    amountColumn("grossAmount", "Giá trị gộp"),
    amountColumn("feeAmount", "Phí"),
    amountColumn("recognisedAmount", "Doanh thu"),
    { id: "first", header: "Đợt 1", cell: ({ row }) => <Tranche amount={row.original.firstTrancheAmount} status={row.original.firstTrancheStatus} /> },
    {
      id: "hold",
      header: "Đợt tạm giữ",
      cell: ({ row }) => (
        <Tranche
          amount={row.original.heldAmount}
          status={row.original.heldAmount > 0 ? row.original.holdTrancheStatus : null}
          note={row.original.holdTrancheStatus === "HELD" ? `Hết giữ ${formatVnDate(row.original.holdReleaseAt)}` : undefined}
        />
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Thao tác</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <RowActions subject={row.original.orderCode} actions={[{ label: "Xem chi tiết", icon: <Eye size={16} />, onClick: () => onView(row.original) }]} />
      ),
    },
  ];
}
