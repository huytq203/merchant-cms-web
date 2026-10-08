import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge/Badge";
import { createIndexColumn } from "@/components/page/IndexColumn";
import { RowActions } from "@/components/page/RowActions";
import { StatusBadge } from "@/components/page/StatusBadge";
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

function StatusCell({ account, pending }: { account: BankAccount; pending?: BankChangeRequest }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <StatusBadge
        label={bankLinkLabel(account)}
        tone={account.linkStatus === "LINKED" ? "success" : account.linkStatus === "PENDING_VERIFICATION" ? "warning" : "danger"}
      />
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

function BankAccountRowActions({ account, options }: { account: BankAccount; options: BankAccountColumnOptions }) {
  const { onEdit, onSetDefault, onDelete } = options;
  const editable = canChangeBank(account, options.pendingChanges[account.id]);
  return (
    <RowActions
      subject={bankAccountTitle(account)}
      actions={[
        { label: "Xem tài khoản", icon: <Eye size={16} />, onClick: () => options.onView(account) },
        {
          label: "Sửa tài khoản",
          icon: <Pencil size={16} />,
          visible: Boolean(onEdit),
          disabled: !editable,
          disabledReason: editLabel(account, editable),
          onClick: () => onEdit?.(account),
        },
        {
          label: "Đặt làm mặc định",
          icon: <Star size={16} />,
          visible: Boolean(onSetDefault),
          disabled: account.isDefault || account.status === "INACTIVE",
          disabledReason: defaultLabel(account),
          onClick: () => onSetDefault?.(account),
        },
        { label: "Xoá tài khoản", icon: <Trash2 size={16} />, visible: Boolean(onDelete), onClick: () => onDelete?.(account) },
      ]}
    />
  );
}

export function getBankAccountColumns(options: BankAccountColumnOptions, page: number, pageSize: number): ColumnDef<BankAccount>[] {
  return [
    createIndexColumn<BankAccount>({ page, pageSize }),
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
    { id: "branch", header: "Chi nhánh", cell: ({ row }) => row.original.branchName || "Chưa có" },
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
      header: () => <span className="w-px whitespace-nowrap">Thao tác</span>,
      enableSorting: false,
      cell: ({ row }) => <BankAccountRowActions account={row.original} options={options} />,
    },
  ];
}
