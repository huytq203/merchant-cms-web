import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { DateTimeCell } from "@/components/page/DateTimeCell";
import { createIndexColumn } from "@/components/page/IndexColumn";
import { RowActions } from "@/components/page/RowActions";
import { bankDisplayName } from "@/features/bank-accounts/utils/bank-mapper";
import { formatAmount } from "@/lib/utils/helper";
import { StatusBadge } from "@/components/page/StatusBadge";
import { EMPTY_VALUE, REQUEST_TYPE_LABELS } from "../constants/Withdrawal.constants";
import { WithdrawalStatusBadge } from "../components/WithdrawalStatusBadge";
import type { Withdrawal } from "../types/types";
import { withdrawalBreakdown, withdrawalTitle } from "../utils/withdrawal-mapper";

export type WithdrawalColumnActions = {
  onView: (withdrawal: Withdrawal) => void;
};

const money = (value: number | null) => (value === null ? EMPTY_VALUE : formatAmount(value));

function BankCell({ withdrawal }: { withdrawal: Withdrawal }) {
  return (
    <div className="space-y-0.5">
      <p className="font-medium">
        {bankDisplayName(withdrawal.bankCode)}{" "}
        <span className="font-mono">{withdrawal.bankAccountMasked}</span>
      </p>
      <p className="text-xs text-muted-foreground">{withdrawal.bankAccountName}</p>
    </div>
  );
}

export function getWithdrawalColumns(actions: WithdrawalColumnActions, page: number, pageSize: number): ColumnDef<Withdrawal>[] {
  return [
    createIndexColumn<Withdrawal>({ page, pageSize }),
    {
      id: "transactionCode",
      header: "Mã giao dịch",
      cell: ({ row }) => (
        <div className="space-y-1">
          <span className="font-mono font-semibold">{row.original.transactionCode ?? "Chờ cấp mã"}</span>
          {/* Requests the system made on the Sub's cycle are told apart from the ones a user created. */}
          {row.original.requestType === "AUTO_SWEEP" ? (
            <div><StatusBadge label={REQUEST_TYPE_LABELS.AUTO_SWEEP} tone="info" /></div>
          ) : null}
        </div>
      ),
    },
    {
      id: "amount",
      header: "Số tiền rút",
      meta: { align: "right" },
      cell: ({ row }) => <span className="font-mono font-semibold tabular-nums">{formatAmount(row.original.amount)}</span>,
    },
    {
      id: "setoff",
      header: "Cấn trừ ký quỹ",
      meta: { align: "right" },
      cell: ({ row }) => <span className="font-mono tabular-nums">{formatAmount(row.original.setoffAmount)}</span>,
    },
    {
      id: "fee",
      header: "Phí rút",
      meta: { align: "right" },
      cell: ({ row }) => <span className="font-mono tabular-nums text-danger">{money(row.original.fee)}</span>,
    },
    {
      id: "net",
      header: "Thực nhận",
      meta: { align: "right" },
      cell: ({ row }) => {
        const { net, totalDebit } = withdrawalBreakdown(row.original);
        return (
          <div className="space-y-0.5">
            <span className="font-mono font-semibold tabular-nums">{money(net)}</span>
            {/* Old ADD_ON request only: its fee was charged on top of the amount, so say what left the wallet. */}
            {totalDebit !== null ? <p className="text-xs text-muted-foreground">Tổng trừ ví {formatAmount(totalDebit)}</p> : null}
          </div>
        );
      },
    },
    { id: "bank", header: "Tài khoản nhận", cell: ({ row }) => <BankCell withdrawal={row.original} /> },
    { id: "createdAt", header: "Ngày yêu cầu", cell: ({ row }) => <DateTimeCell value={row.original.createdAt} /> },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => <WithdrawalStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: () => <span className="w-px whitespace-nowrap">Thao tác</span>,
      enableSorting: false,
      cell: ({ row }) => <RowActions subject={withdrawalTitle(row.original)} actions={[
        { label: "Xem chi tiết yêu cầu rút tiền", icon: <Eye size={16} />, onClick: () => actions.onView(row.original) },
      ]} />,
    },
  ];
}
