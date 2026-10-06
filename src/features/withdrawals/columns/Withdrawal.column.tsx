import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip/Tooltip";
import { bankDisplayName } from "@/features/bank-accounts/utils/bank-mapper";
import { formatAmount, formatDate } from "@/lib/utils/helper";
import { EMPTY_VALUE } from "../constants/Withdrawal.constants";
import { WithdrawalStatusBadge } from "../components/WithdrawalStatusBadge";
import type { Withdrawal } from "../types/types";
import { withdrawalTitle, withdrawalTotalDebit } from "../utils/withdrawal-mapper";

export type WithdrawalColumnActions = {
  onView: (withdrawal: Withdrawal) => void;
};

const money = (value: number | null) => (value === null ? EMPTY_VALUE : formatAmount(value));

type ViewActionProps = { withdrawal: Withdrawal; onView: (withdrawal: Withdrawal) => void };

function ViewAction({ withdrawal, onView }: ViewActionProps) {
  const label = `Xem chi tiết yêu cầu rút tiền ${withdrawalTitle(withdrawal)}`;
  const trigger = (
    <Button type="button" variant="ghost" size="icon-sm" aria-label={label} onClick={() => onView(withdrawal)} />
  );
  return (
    <Tooltip>
      <TooltipTrigger render={trigger}>
        <Eye size={16} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

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

function TimeCell({ withdrawal }: { withdrawal: Withdrawal }) {
  return (
    <div className="space-y-0.5 text-xs">
      <p className="font-mono">{formatDate(withdrawal.createdAt)}</p>
    </div>
  );
}

export function getWithdrawalColumns(actions: WithdrawalColumnActions): ColumnDef<Withdrawal>[] {
  return [
    {
      id: "transactionCode",
      header: "Mã giao dịch",
      cell: ({ row }) => (
        <span className="font-mono font-semibold">{row.original.transactionCode ?? "Chờ cấp mã"}</span>
      ),
    },
    {
      id: "amount",
      header: "Số tiền rút",
      meta: { align: "right" },
      cell: ({ row }) => <span className="font-mono font-semibold">{formatAmount(row.original.amount)}</span>,
    },
    {
      id: "fee",
      header: "Phí rút",
      meta: { align: "right" },
      cell: ({ row }) => <span className="font-mono text-danger">{money(row.original.fee)}</span>,
    },
    {
      id: "totalDebit",
      header: "Tổng trừ ví",
      meta: { align: "right" },
      cell: ({ row }) => <span className="font-mono">{money(withdrawalTotalDebit(row.original))}</span>,
    },
    { id: "bank", header: "Tài khoản nhận", cell: ({ row }) => <BankCell withdrawal={row.original} /> },
    { id: "createdAt", header: "Ngày yêu cầu", cell: ({ row }) => <TimeCell withdrawal={row.original} /> },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => <WithdrawalStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "Thao tác",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <ViewAction withdrawal={row.original} onView={actions.onView} />
        </div>
      ),
    },
  ];
}
