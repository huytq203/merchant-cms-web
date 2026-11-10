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

/**
 * Appends the totals row. Every column, including "Tổng", is summed from `byForm` (the BE V65 CHECK allows only
 * TRANSFER, SUB_REVENUE and SETOFF), so the total row always equals the sum of its own columns.
 */
export function withTotalRow(rows: EscrowContribution[]): EscrowContributionRow[] {
  const sum = (form: string) => rows.reduce((acc, row) => acc + (row.byForm[form] ?? 0), 0);
  const byForm = { TRANSFER: sum("TRANSFER"), SUB_REVENUE: sum("SUB_REVENUE"), SETOFF: sum("SETOFF") };
  return [
    ...rows,
    { subMerchantId: null, subCode: null, subName: null, amount: byForm.TRANSFER + byForm.SUB_REVENUE + byForm.SETOFF, byForm, isTotal: true },
  ];
}

/** The closing row reads heavier than the contributors above it. */
const weight = (row: EscrowContributionRow) => (row.isTotal ? "font-bold" : "");

export function escrowContributionColumns(masterName: string): ColumnDef<EscrowContributionRow>[] {
  return [
    {
      id: "contributor",
      header: "Bên đóng góp",
      cell: ({ row }) => (
        <span className={row.original.isTotal ? "font-bold uppercase" : "font-semibold"}>
          {row.original.isTotal
            ? "Tổng"
            : row.original.subMerchantId
              ? `${row.original.subCode ?? ""} · ${row.original.subName ?? ""}`
              : `${masterName} (cấp Master)`}
        </span>
      ),
    },
    { id: "transfer", header: "Chuyển khoản", meta: right, cell: ({ row }) => <span className={`tabular-nums ${weight(row.original)}`}>{money(row.original.byForm.TRANSFER ?? 0)}</span> },
    {
      id: "subRevenue",
      header: "Từ doanh thu Sub",
      meta: right,
      cell: ({ row }) => {
        const setoff = row.original.byForm.SETOFF ?? 0;
        return (
          <div className={`tabular-nums ${weight(row.original)}`}>
            <span>{money(subRevenueOf(row.original.byForm))}</span>
            {setoff > 0 ? <p className="text-xs font-normal text-muted-foreground">trong đó cấn trừ khi rút {money(setoff)}</p> : null}
          </div>
        );
      },
    },
    { id: "amount", header: "Tổng", meta: right, cell: ({ row }) => <span className={`tabular-nums ${row.original.isTotal ? "font-bold" : "font-semibold"}`}>{money(row.original.amount)}</span> },
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
