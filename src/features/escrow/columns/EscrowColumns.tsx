import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/page/StatusBadge";
import { formatVnDateTime } from "@/lib/utils/vn-time";
import { ESCROW_LEDGER_KIND } from "../constants/escrow-labels";
import type { EscrowContribution, EscrowLedgerEntry } from "../types";

const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value);
const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${money(Math.abs(value))}`;
const right = { align: "right" as const };

/** A table row: a contributor, or the closing "Tổng" row that sums every column. */
export type EscrowContributionRow = EscrowContribution & { isTotal?: boolean };

/** Set-off at withdrawal is escrow funded from the Sub's revenue, so it counts under "Từ doanh thu Sub". */
const subRevenueOf = (byForm: EscrowContribution["byForm"]) => (byForm.SUB_REVENUE ?? 0) + (byForm.SETOFF ?? 0);

/** Appends the totals row: each column is the sum of the rows above it, not a recomputation from another source. */
export function withTotalRow(rows: EscrowContribution[]): EscrowContributionRow[] {
  const sum = (pick: (row: EscrowContribution) => number) => rows.reduce((acc, row) => acc + pick(row), 0);
  return [
    ...rows,
    {
      subMerchantId: null,
      subCode: null,
      subName: null,
      amount: sum((row) => row.amount),
      byForm: { TRANSFER: sum((row) => row.byForm.TRANSFER ?? 0), SUB_REVENUE: sum((row) => row.byForm.SUB_REVENUE ?? 0), SETOFF: sum((row) => row.byForm.SETOFF ?? 0) },
      isTotal: true,
    },
  ];
}

export function escrowContributionColumns(masterName: string): ColumnDef<EscrowContributionRow>[] {
  return [
    {
      id: "contributor",
      header: "Bên đóng góp",
      cell: ({ row }) => (
        <span className="font-semibold">
          {row.original.isTotal
            ? "Tổng"
            : row.original.subMerchantId
              ? `${row.original.subCode ?? ""} · ${row.original.subName ?? ""}`
              : `${masterName} (cấp Master)`}
        </span>
      ),
    },
    { id: "transfer", header: "Chuyển khoản", meta: right, cell: ({ row }) => <span className="tabular-nums">{money(row.original.byForm.TRANSFER ?? 0)}</span> },
    {
      id: "subRevenue",
      header: "Từ doanh thu Sub",
      meta: right,
      cell: ({ row }) => {
        const setoff = row.original.byForm.SETOFF ?? 0;
        return (
          <div className="tabular-nums">
            <span>{money(subRevenueOf(row.original.byForm))}</span>
            {setoff > 0 ? <p className="text-xs font-normal text-muted-foreground">trong đó cấn trừ khi rút {money(setoff)}</p> : null}
          </div>
        );
      },
    },
    { id: "amount", header: "Tổng", meta: right, cell: ({ row }) => <span className="font-semibold tabular-nums">{money(row.original.amount)}</span> },
  ];
}

export const escrowLedgerColumns: ColumnDef<EscrowLedgerEntry>[] = [
  { id: "seq", header: "STT", meta: right, cell: ({ row }) => <span className="tabular-nums">{row.original.seq}</span> },
  { id: "occurredAt", header: "Thời điểm", cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{formatVnDateTime(row.original.occurredAt)}</span> },
  {
    id: "kind",
    header: "Loại",
    cell: ({ row }) => <StatusBadge label={ESCROW_LEDGER_KIND[row.original.kind].label} tone={ESCROW_LEDGER_KIND[row.original.kind].tone} />,
  },
  { id: "note", header: "Ghi chú", cell: ({ row }) => row.original.note || "—" },
  { id: "amountDelta", header: "Biến động", meta: right, cell: ({ row }) => <span className="tabular-nums">{signed(row.original.amountDelta)}</span> },
  { id: "balanceAfter", header: "Số dư sau", meta: right, cell: ({ row }) => <span className="font-semibold tabular-nums">{money(row.original.balanceAfter)}</span> },
];
