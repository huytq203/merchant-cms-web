import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/page/StatusBadge";
import { formatAmount } from "@/lib/utils/helper";
import { formatVnDateTime } from "@/lib/utils/vn-time";
import { FREEZE_STATUS } from "../constants/freeze-labels";
import type { RevenueFreeze } from "../types";

const right = { align: "right" as const };
const EMPTY = "—";

/** One row per freeze: what FlexPay asked to hold, what the ledger could hold, what is still owed and what came back. */
export const freezeColumns: ColumnDef<RevenueFreeze>[] = [
  {
    id: "code",
    header: "Mã đóng băng",
    cell: ({ row }) => (
      <div>
        <div className="font-mono font-semibold">{row.original.freezeCode ?? EMPTY}</div>
        <div className="text-sm text-muted-foreground tabular-nums">{formatVnDateTime(row.original.createdAt)}</div>
      </div>
    ),
  },
  {
    id: "order",
    header: "Mã đơn hàng",
    cell: ({ row }) => <span className="font-mono">{row.original.orderCode ?? EMPTY}</span>,
  },
  {
    id: "reason",
    header: "Lý do",
    cell: ({ row }) => <span className="whitespace-normal">{row.original.reason ?? EMPTY}</span>,
  },
  { id: "requested", header: "Yêu cầu", meta: right, cell: ({ row }) => <span className="tabular-nums">{formatAmount(row.original.requested)}</span> },
  { id: "frozen", header: "Đã băng", meta: right, cell: ({ row }) => <span className="font-semibold tabular-nums">{formatAmount(row.original.frozen)}</span> },
  {
    id: "shortfall",
    header: "Còn hụt",
    meta: right,
    // The BE only computes a shortfall while the freeze is active; any other state sends 0.
    cell: ({ row }) => <span className="tabular-nums">{row.original.status === "ACTIVE" ? formatAmount(row.original.shortfall) : EMPTY}</span>,
  },
  { id: "released", header: "Đã gỡ", meta: right, cell: ({ row }) => <span className="tabular-nums">{formatAmount(row.original.released)}</span> },
  {
    id: "scheduledReleaseAt",
    header: "Hạn gỡ băng",
    cell: ({ row }) => <span className="tabular-nums">{row.original.scheduledReleaseAt ? formatVnDateTime(row.original.scheduledReleaseAt) : "Chưa đặt hạn"}</span>,
  },
  {
    id: "status",
    header: "Trạng thái",
    cell: ({ row }) => <StatusBadge label={FREEZE_STATUS[row.original.status].label} tone={FREEZE_STATUS[row.original.status].tone} />,
  },
];
