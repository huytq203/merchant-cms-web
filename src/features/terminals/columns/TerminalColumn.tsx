import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, Lock, Unlock } from "lucide-react";
import { createIndexColumn } from "@/components/page/IndexColumn";
import { RowActions } from "@/components/page/RowActions";
import type { TerminalRow } from "../types";
import { TerminalStatusBadge } from "../components/TerminalStatusBadge";
import { canLockTerminal, canUnlockTerminal } from "../utils/terminal-mapper";

type Actions = {
  onView: (row: TerminalRow) => void;
  /** Write handlers are left out for a session that may only view; their actions then disappear. */
  onEdit?: (row: TerminalRow) => void;
  onLock?: (row: TerminalRow) => void;
  onUnlock?: (row: TerminalRow) => void;
};

function TerminalRowActions({ item, actions }: { item: TerminalRow; actions: Actions }) {
  const { onEdit, onLock, onUnlock } = actions;
  const lockAction = canLockTerminal(item)
    ? { label: "Khóa", icon: <Lock size={16} />, visible: !!onLock, onClick: () => onLock?.(item) }
    : canUnlockTerminal(item)
      ? { label: "Mở khóa", icon: <Unlock size={16} />, visible: !!onUnlock, onClick: () => onUnlock?.(item) }
      : {
        label: "Mở khóa",
        icon: <Unlock size={16} />,
        visible: !!onUnlock,
        disabled: true,
        disabledReason: item.lockSource === "CASCADE" ? "Không thể mở khóa vì Master đang khóa" : "Không thể thay đổi trạng thái",
      };

  return (
    <RowActions
      subject={item.name}
      actions={[
        { label: "Xem chi tiết", icon: <Eye size={16} />, onClick: () => actions.onView(item) },
        { label: "Sửa", icon: <Edit size={16} />, visible: !!onEdit, onClick: () => onEdit?.(item) },
        lockAction,
      ]}
    />
  );
}

export function getTerminalColumns(actions: Actions, page: number, pageSize: number): ColumnDef<TerminalRow>[] {
  return [
    createIndexColumn<TerminalRow>({ page, pageSize }),
    { accessorKey: "tid", header: "Terminal ID" },
    { accessorKey: "name", header: "Tên Terminal" },
    { accessorKey: "subMerchantName", header: "Sub-merchant" },
    { accessorKey: "address", header: "Địa chỉ", cell: ({ row }) => row.original.address || "—" },
    { id: "status", header: "Trạng thái", cell: ({ row }) => <TerminalStatusBadge row={row.original} /> },
    {
      id: "actions",
      header: () => <span className="w-px whitespace-nowrap">Thao tác</span>,
      enableSorting: false,
      cell: ({ row }) => <TerminalRowActions item={row.original} actions={actions} />,
    },
  ];
}
