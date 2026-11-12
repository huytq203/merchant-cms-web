import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Edit, Eye, Lock, QrCode, Unlock } from "lucide-react";
import { createIndexColumn } from "@/components/page/IndexColumn";
import { RowActions } from "@/components/page/RowActions";
import { Badge } from "@/components/ui/badge/Badge";
import { formatAmount } from "@/lib/utils/helper";
import { terminalTypeLabels } from "../constants/terminal.constants";
import type { TerminalRow } from "../types";
import { TerminalStatusBadge } from "../components/TerminalStatusBadge";
import { canLockTerminal, canUnlockTerminal } from "../utils/terminal-mapper";

type Actions = {
  onView: (row: TerminalRow) => void;
  /** Write handlers are left out for a session that may only view; their actions then disappear. */
  onEdit?: (row: TerminalRow) => void;
  onLock?: (row: TerminalRow) => void;
  onUnlock?: (row: TerminalRow) => void;
  /** Mã QR tĩnh FlexPay của Terminal (QR ví FlexPay 12/11/2026); có cho cả người chỉ xem để mở màn hiển thị. */
  onStaticQr?: (row: TerminalRow) => void;
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
        { label: "QR tĩnh", icon: <QrCode size={16} />, visible: !!actions.onStaticQr, onClick: () => actions.onStaticQr?.(item) },
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
    {
      id: "terminalType",
      header: "Loại",
      cell: ({ row }) => <Badge variant="secondary">{terminalTypeLabels[row.original.terminalType]}</Badge>,
    },
    { accessorKey: "subMerchantName", header: "Sub-merchant" },
    { accessorKey: "address", header: "Địa chỉ", cell: ({ row }) => row.original.address || "—" },
    {
      id: "txn7d",
      header: "GD 7 ngày",
      cell: ({ row }) => {
        const count = row.original.txnCount7d ?? 0;
        // No transaction in the window reads as a plain zero, not "0 · 0 vnđ".
        if (count === 0) return <span className="tabular-nums text-muted-foreground">0</span>;
        return (
          <span className="tabular-nums">
            {count} · {formatAmount(row.original.txnAmount7d ?? 0)}
          </span>
        );
      },
    },
    {
      id: "lastTxnAt",
      header: "GD gần nhất",
      cell: ({ row }) => {
        const value = row.original.lastTxnAt;
        const date = value ? new Date(value) : null;
        return date && !Number.isNaN(date.getTime())
          ? <time className="tabular-nums" dateTime={date.toISOString()}>{format(date, "dd/MM HH:mm")}</time>
          : <span className="text-muted-foreground">—</span>;
      },
    },
    { id: "status", header: "Trạng thái", cell: ({ row }) => <TerminalStatusBadge row={row.original} /> },
    {
      id: "actions",
      header: () => <span className="w-px whitespace-nowrap">Thao tác</span>,
      enableSorting: false,
      cell: ({ row }) => <TerminalRowActions item={row.original} actions={actions} />,
    },
  ];
}
