import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/page/StatusBadge";
import { formatVnDateTime } from "@/lib/utils/vn-time";
import { ESCROW_LEDGER_KIND } from "../constants/escrow-labels";
import type { EscrowContribution, EscrowLedgerEntry } from "../types";

const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value);
const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${money(Math.abs(value))}`;
const right = { align: "right" as const };

export function escrowContributionColumns(masterName: string): ColumnDef<EscrowContribution>[] {
  return [
    {
      id: "contributor",
      header: "Bên đóng góp",
      cell: ({ row }) => (
        <span className="font-semibold">
          {row.original.subMerchantId ? `${row.original.subCode ?? ""} · ${row.original.subName ?? ""}` : `${masterName} (cấp Master)`}
        </span>
      ),
    },
    { id: "transfer", header: "Chuyển khoản", meta: right, cell: ({ row }) => <span className="tabular-nums">{money(row.original.byForm.TRANSFER ?? 0)}</span> },
    { id: "subRevenue", header: "Từ doanh thu Sub", meta: right, cell: ({ row }) => <span className="tabular-nums">{money(row.original.byForm.SUB_REVENUE ?? 0)}</span> },
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
