import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, Lock, Unlock } from "lucide-react";
import { createIndexColumn } from "@/components/page/IndexColumn";
import { RowActions } from "@/components/page/RowActions";
import { StatusBadge } from "@/components/page/StatusBadge";
import type { TerminalRow } from "../types";
import { canLockTerminal, canUnlockTerminal, terminalStatusLabel } from "../utils/terminal-mapper";

type Actions = {
  onView: (row: TerminalRow) => void;
  onEdit: (row: TerminalRow) => void;
  onLock: (row: TerminalRow) => void;
  onUnlock: (row: TerminalRow) => void;
};

function Status({ row }: { row: TerminalRow }) {
  const label = terminalStatusLabel(row);
  if (row.status === "ACTIVE") return <StatusBadge label={label} tone="success" />;
  if (row.status === "TERMINATED") return <StatusBadge label={label} tone="neutral" />;
  return <StatusBadge label={label} tone={row.lockSource === "CASCADE" ? "warning" : "neutral"} />;
}

function TerminalRowActions({ item, actions }: { item: TerminalRow; actions: Actions }) {
  const lockAction = canLockTerminal(item)
    ? { label: "Khóa", icon: <Lock size={16} />, onClick: () => actions.onLock(item) }
    : canUnlockTerminal(item)
      ? { label: "Mở khóa", icon: <Unlock size={16} />, onClick: () => actions.onUnlock(item) }
      : {
        label: "Mở khóa",
        icon: <Unlock size={16} />,
        disabled: true,
        disabledReason: item.lockSource === "CASCADE" ? "Không thể mở khóa vì Master đang khóa" : "Không thể thay đổi trạng thái",
      };

  return (
    <RowActions
      subject={item.name}
      actions={[
        { label: "Xem chi tiết", icon: <Eye size={16} />, onClick: () => actions.onView(item) },
        { label: "Sửa", icon: <Edit size={16} />, onClick: () => actions.onEdit(item) },
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
    { id: "status", header: "Trạng thái", cell: ({ row }) => <Status row={row.original} /> },
    {
      id: "actions",
      header: () => <span className="w-px whitespace-nowrap">Thao tác</span>,
      enableSorting: false,
      cell: ({ row }) => <TerminalRowActions item={row.original} actions={actions} />,
    },
  ];
}
