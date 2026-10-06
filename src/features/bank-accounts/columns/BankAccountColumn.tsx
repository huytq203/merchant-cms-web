import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Star, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge/Badge";
import { Button } from "@/components/ui/button/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip/Tooltip";
import { BankChangeRequestBadge } from "../components/BankChangeRequestBadge";
import { bankAccountTitle, bankDisplayName, bankLinkLabel, canChangeBank } from "../utils/bank-mapper";
import type { BankAccount, BankChangeRequest } from "../types";

export type BankAccountColumnOptions = {
  pendingChanges: Record<string, BankChangeRequest>;
  onView: (account: BankAccount) => void;
  /** Write actions are passed only while BANK_ACCOUNT_WRITES_ENABLED; without them the row shows view only. */
  onEdit?: (account: BankAccount) => void;
  onSetDefault?: (account: BankAccount) => void;
  onDelete?: (account: BankAccount) => void;
};

const linkVariants = {
  LINKED: "soft-success",
  PENDING_VERIFICATION: "soft-warning",
  LINK_FAILED: "soft-danger",
} as const;

type ActionProps = { label: string; onClick: () => void; disabled?: boolean; children: ReactNode };

function Action({ label, onClick, disabled, children }: ActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button type="button" variant="ghost" size="icon-sm" aria-label={label} disabled={disabled} onClick={onClick} />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function StatusCell({ account, pending }: { account: BankAccount; pending?: BankChangeRequest }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Badge variant={linkVariants[account.linkStatus]} className="w-36 justify-center">
        {bankLinkLabel(account)}
      </Badge>
      {account.status === "INACTIVE" && <Badge variant="outline">Ngừng sử dụng</Badge>}
      {pending && <BankChangeRequestBadge request={pending} />}
    </div>
  );
}

function editLabel(account: BankAccount, editable: boolean): string {
  if (editable) return `Sửa tài khoản ${bankAccountTitle(account)}`;
  return `Không thể sửa ${bankAccountTitle(account)} vì đang chờ duyệt hoặc đã ngừng sử dụng`;
}

function defaultLabel(account: BankAccount): string {
  if (account.isDefault) return `${bankAccountTitle(account)} đang là tài khoản mặc định`;
  return `Đặt ${bankAccountTitle(account)} làm tài khoản mặc định`;
}

function RowActions({ account, options }: { account: BankAccount; options: BankAccountColumnOptions }) {
  const { onEdit, onSetDefault, onDelete } = options;
  const editable = canChangeBank(account, options.pendingChanges[account.id]);
  return (
    <div className="flex items-center gap-1">
      <Action label={`Xem tài khoản ${bankAccountTitle(account)}`} onClick={() => options.onView(account)}>
        <Eye size={16} />
      </Action>
      {onEdit && (
        <Action label={editLabel(account, editable)} disabled={!editable} onClick={() => onEdit(account)}>
          <Pencil size={16} />
        </Action>
      )}
      {onSetDefault && (
        <Action
          label={defaultLabel(account)}
          disabled={account.isDefault || account.status === "INACTIVE"}
          onClick={() => onSetDefault(account)}
        >
          <Star size={16} />
        </Action>
      )}
      {onDelete && (
        <Action label={`Xoá tài khoản ${bankAccountTitle(account)}`} onClick={() => onDelete(account)}>
          <Trash2 size={16} />
        </Action>
      )}
    </div>
  );
}

export function getBankAccountColumns(options: BankAccountColumnOptions): ColumnDef<BankAccount>[] {
  return [
    {
      id: "bank",
      header: "Ngân hàng",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium">
          {bankDisplayName(row.original.bankCode)}
          {row.original.isDefault && <Badge variant="soft-primary">Mặc định</Badge>}
        </div>
      ),
    },
    { id: "branch", header: "Chi nhánh", cell: ({ row }) => row.original.branchName || "—" },
    {
      id: "accountNumber",
      header: "Số tài khoản",
      cell: ({ row }) => <span className="font-mono">{row.original.accountNumber}</span>,
    },
    { accessorKey: "accountName", header: "Chủ tài khoản" },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => <StatusCell account={row.original} pending={options.pendingChanges[row.original.id]} />,
    },
    {
      id: "actions",
      header: "Thao tác",
      enableSorting: false,
      cell: ({ row }) => <RowActions account={row.original} options={options} />,
    },
  ];
}
