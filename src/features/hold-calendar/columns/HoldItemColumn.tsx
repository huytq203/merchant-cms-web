import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/page/StatusBadge";
import { formatVnDate, formatVnDateTime } from "@/lib/utils/vn-time";
import { HOLD_ITEM_STATE, WEEKDAY_SHORT } from "../constants/hold-labels";
import type { HoldItem } from "../types";

const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value);

const VN_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" });

/** Ngày VN (yyyy-MM-dd) của một mốc ISO, bất kể múi giờ của máy chạy; null khi không có mốc hoặc mốc hỏng. */
export function vnDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : VN_DAY.format(date);
}

/** "13/11/2026 (T6)": ngày giải phóng/hủy của khoản theo giờ VN kèm thứ; "—" khi không có mốc. */
export function releaseDayLabel(iso: string | null | undefined): string {
  const day = vnDay(iso);
  if (!day) return "—";
  return `${formatVnDate(day)} (${WEEKDAY_SHORT[new Date(`${day}T00:00:00Z`).getUTCDay()]})`;
}

/** Số ngày lịch từ hôm nay (VN) tới ngày giải phóng; âm/0 coi như đến hạn; null khi không có mốc. */
function daysUntil(iso: string | null | undefined, today: string): number | null {
  const day = vnDay(iso);
  return day ? Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000) : null;
}

/** Câu trạng thái của một khoản: còn bao lâu nếu đang giữ, lúc nào nếu đã giải phóng/hủy. */
export function holdStateLabel(item: HoldItem, today: string): string {
  const base = HOLD_ITEM_STATE[item.state].label;
  if (item.state === "HOLDING") {
    const days = daysUntil(item.eventAt ?? item.holdReleaseAt, today);
    if (days === null) return base;
    return days > 0 ? `${base} · còn ${days} ngày` : `${base} · đến hạn hôm nay`;
  }
  const at = item.state === "CANCELLED_BY_REFUND" ? item.cancelledAt : item.releasedAt;
  return at ? `${base} ${formatVnDateTime(at).slice(0, 16).replace(/\/\d{4}/, "")}` : base;
}

/** Cột danh sách từng khoản (mục 14): mã đơn hàng ở dòng chính, mã giao dịch ở dòng phụ. */
export function holdItemColumns(today: string): ColumnDef<HoldItem>[] {
  return [
    { id: "eventAt", header: "Ngày giải phóng", cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{releaseDayLabel(row.original.eventAt ?? row.original.holdReleaseAt)}</span> },
    {
      id: "orderCode",
      header: "Mã đơn hàng",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold">{row.original.orderCode}</div>
          {row.original.transactionCode ? <div className="text-xs text-muted-foreground">{row.original.transactionCode}</div> : null}
        </div>
      ),
    },
    {
      id: "subTerminal",
      header: "Sub · Terminal",
      cell: ({ row }) => (
        <span>{[row.original.subMerchantName ?? row.original.subMerchantCode, row.original.terminalCode].filter(Boolean).join(" · ") || "—"}</span>
      ),
    },
    {
      id: "heldAmount",
      header: "Số tiền giữ",
      meta: { align: "right" },
      cell: ({ row }) => <span className="tabular-nums">{money(row.original.heldAmount)}</span>,
    },
    {
      id: "state",
      header: "Trạng thái",
      cell: ({ row }) => <StatusBadge label={holdStateLabel(row.original, today)} tone={HOLD_ITEM_STATE[row.original.state].tone} />,
    },
  ];
}
