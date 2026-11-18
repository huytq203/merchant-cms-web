import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge/Badge";
import { DateTimeCell } from "@/components/page/DateTimeCell";
import { createIndexColumn } from "@/components/page/IndexColumn";
import { RowActions } from "@/components/page/RowActions";
import { StatusBadge } from "@/components/page/StatusBadge";
import { BankAccountSubsCell } from "../components/BankAccountSubsCell";
import { bankAccountStatusLabel, bankAccountStatusTone, bankAccountTitle, bankDisplayName } from "../utils/bank-mapper";
import type { BankAccount } from "../types";

export type BankAccountColumnOptions = {
  onView: (account: BankAccount) => void;
  /** Write handlers are left out for a session without MANAGE_BANK_ACCOUNT; their actions then disappear. */
  onEdit?: (account: BankAccount) => void;
  onSetDefault?: (account: BankAccount) => void;
  onDelete?: (account: BankAccount) => void;
};

/** BE từ chối đặt mặc định cho TK Khóa (409 5738), nên khóa nút sẵn và nói lý do. */
function defaultDisabledReason(account: BankAccount): string {
  if (account.isDefault) return `${bankAccountTitle(account)} đang là tài khoản mặc định`;
  if (account.accountStatus === "LOCKED") return `${bankAccountTitle(account)} đang bị khóa, không thể đặt làm mặc định`;
  return `Đặt ${bankAccountTitle(account)} làm tài khoản mặc định`;
}

/**
 * SRS v2: mọi thay đổi áp dụng ngay sau OTP (không còn đề xuất chờ Flexpay duyệt), nên Sửa luôn mở được. Portal không
 * có khóa/mở khóa TK — đó là thao tác của Admin.
 */
export const DELETE_ASSIGNED_REASON = "Tài khoản đang được Sub-merchant sử dụng, hãy gỡ Sub-merchant trước khi xoá";

function BankAccountRowActions({ account, options }: { account: BankAccount; options: BankAccountColumnOptions }) {
  const { onEdit, onSetDefault, onDelete } = options;
  return (
    <RowActions
      subject={bankAccountTitle(account)}
      actions={[
        { label: "Xem tài khoản", icon: <Eye size={16} />, onClick: () => options.onView(account) },
        { label: "Sửa tài khoản", icon: <Pencil size={16} />, visible: !!onEdit, onClick: () => onEdit?.(account) },
        {
          label: "Đặt làm mặc định",
          icon: <Star size={16} />,
          visible: !!onSetDefault,
          disabled: account.isDefault || account.accountStatus === "LOCKED",
          disabledReason: defaultDisabledReason(account),
          onClick: () => onSetDefault?.(account),
        },
        {
          label: "Xoá tài khoản",
          icon: <Trash2 size={16} />,
          visible: !!onDelete,
          // BE từ chối xóa TK đang gán Sub (5756): báo trước, không để người dùng đi tới bước xác nhận mới biết.
          disabled: account.assignedSubMerchants.length > 0,
          disabledReason: DELETE_ASSIGNED_REASON,
          onClick: () => onDelete?.(account),
        },
      ]}
    />
  );
}

export function getBankAccountColumns(options: BankAccountColumnOptions, page: number, pageSize: number): ColumnDef<BankAccount>[] {
  return [
    createIndexColumn<BankAccount>({ page, pageSize }),
    {
      id: "subMerchants",
      header: "Sub-merchant đang dùng",
      cell: ({ row }) => <BankAccountSubsCell subs={row.original.assignedSubMerchants} />,
    },
    {
      id: "bank",
      header: "Ngân hàng",
      cell: ({ row }) => <span className="font-medium">{bankDisplayName(row.original.bankCode)}</span>,
    },
    {
      id: "accountNumber",
      header: "Số tài khoản",
      cell: ({ row }) => <span className="font-mono">{row.original.accountNumber}</span>,
    },
    { id: "accountName", header: "Chủ tài khoản", cell: ({ row }) => row.original.accountName || "--" },
    {
      id: "isDefault",
      header: "Mặc định",
      cell: ({ row }) => (row.original.isDefault
        ? <Badge variant="soft-primary">Mặc định</Badge>
        : <span className="text-muted-foreground">—</span>),
    },
    {
      id: "accountStatus",
      header: "Trạng thái tài khoản",
      cell: ({ row }) => (
        <StatusBadge
          label={bankAccountStatusLabel(row.original.accountStatus)}
          tone={bankAccountStatusTone(row.original.accountStatus)}
        />
      ),
    },
    {
      id: "updatedAt",
      header: "Cập nhật lần cuối",
      cell: ({ row }) => (row.original.updatedAt
        ? <DateTimeCell value={row.original.updatedAt} />
        : <span className="text-muted-foreground">—</span>),
    },
    {
      id: "actions",
      header: () => <span className="w-px whitespace-nowrap">Thao tác</span>,
      enableSorting: false,
      cell: ({ row }) => <BankAccountRowActions account={row.original} options={options} />,
    },
  ];
}
