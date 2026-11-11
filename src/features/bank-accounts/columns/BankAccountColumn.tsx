import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge/Badge";
import { createIndexColumn } from "@/components/page/IndexColumn";
import { RowActions } from "@/components/page/RowActions";
import { StatusBadge } from "@/components/page/StatusBadge";
import { BankAccountScopeLabel } from "../components/BankAccountScopeLabel";
import { BankChangeRequestBadge } from "../components/BankChangeRequestBadge";
import { bankAccountTitle, bankDisplayName, bankLinkLabel, canChangeBank } from "../utils/bank-mapper";
import type { BankAccount } from "../types";

export type BankAccountColumnOptions = {
  onView: (account: BankAccount) => void;
  /** Write handlers are left out for a session without MANAGE_BANK_ACCOUNT; their actions then disappear. */
  onEdit?: (account: BankAccount) => void;
  onSetDefault?: (account: BankAccount) => void;
  onDelete?: (account: BankAccount) => void;
};

function StatusCell({ account }: { account: BankAccount }) {
  const pending = account.pendingChangeRequest;
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
  const editable = canChangeBank(account);
  return (
    <RowActions
      subject={bankAccountTitle(account)}
      actions={[
        { label: "Xem tài khoản", icon: <Eye size={16} />, onClick: () => options.onView(account) },
        {
          label: "Sửa tài khoản",
          icon: <Pencil size={16} />,
          visible: !!onEdit,
          disabled: !editable,
          disabledReason: editLabel(account, editable),
          onClick: () => onEdit?.(account),
        },
        {
          label: "Đặt làm mặc định",
          icon: <Star size={16} />,
          visible: !!onSetDefault,
          disabled: account.isDefault || account.status === "INACTIVE" || account.pendingChangeRequest?.status === "PENDING",
          disabledReason: defaultLabel(account),
          onClick: () => onSetDefault?.(account),
        },
        { label: "Xoá tài khoản", icon: <Trash2 size={16} />, visible: !!onDelete, onClick: () => onDelete?.(account) },
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
    // TK gắn Sub nào (11/11/2026): trước đây phải mở chi tiết mới biết, giờ hiện ngay ở bảng.
    { id: "scope", header: "Áp dụng cho", cell: ({ row }) => <BankAccountScopeLabel account={row.original} /> },
    { id: "branch", header: "Chi nhánh", cell: ({ row }) => row.original.branchName || "--" },
    {
      id: "accountNumber",
      header: "Số tài khoản",
      cell: ({ row }) => <span className="font-mono">{row.original.accountNumber}</span>,
    },
    { id: "accountName", header: "Chủ tài khoản", cell: ({ row }) => row.original.accountName || "--" },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => <StatusCell account={row.original} />,
    },
    {
      id: "actions",
      header: () => <span className="w-px whitespace-nowrap">Thao tác</span>,
      enableSorting: false,
      cell: ({ row }) => <BankAccountRowActions account={row.original} options={options} />,
    },
  ];
}
