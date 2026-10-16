import type { ColumnDef } from "@tanstack/react-table";
import { formatVnDate } from "@/lib/utils/vn-time";
import { WEEKDAY_LABEL } from "../constants/hold-labels";
import type { HoldDay } from "../types";

const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value);
const right = { align: "right" as const };

/** `today` and `peak` come from the page so the cells stay pure. */
export function holdDayColumns(today: string, peakAmount: number): ColumnDef<HoldDay>[] {
  return [
    {
      id: "date",
      header: "Ngày",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold tabular-nums">{formatVnDate(row.original.date)}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.date === today ? "Hôm nay, gồm khoản đã quá ngày" : WEEKDAY_LABEL[row.original.weekday] ?? row.original.weekday}
          </div>
        </div>
      ),
    },
    { id: "count", header: "Số khoản", meta: right, cell: ({ row }) => <span className="tabular-nums">{row.original.count}</span> },
    {
      id: "amount",
      header: "Giải phóng",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-2.5 rounded-sm bg-primary"
            style={{ width: `${Math.max(4, Math.round((row.original.amount / Math.max(peakAmount, 1)) * 160))}px` }}
          />
          <span className="font-semibold tabular-nums">{money(row.original.amount)}</span>
        </div>
      ),
    },
    { id: "cumulative", header: "Lũy kế", meta: right, cell: ({ row }) => <span className="tabular-nums">{money(row.original.cumulativeReleased)}</span> },
    { id: "remaining", header: "Còn giữ", meta: right, cell: ({ row }) => <span className="tabular-nums">{money(row.original.remainingHeld)}</span> },
  ];
}
