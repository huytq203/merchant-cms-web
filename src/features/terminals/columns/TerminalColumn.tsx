import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, Lock, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge/Badge";
import { Button } from "@/components/ui/button/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip/Tooltip";
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
  if (row.status === "ACTIVE") return <Badge variant="soft-success">{label}</Badge>;
  if (row.status === "TERMINATED") return <Badge variant="outline">{label}</Badge>;
  return <Badge variant={row.lockSource === "CASCADE" ? "soft-warning" : "secondary"}>{label}</Badge>;
}

function Action({ label, onClick, disabled, children }: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function LockAction({ item, actions }: { item: TerminalRow; actions: Actions }) {
  if (canLockTerminal(item)) {
    return <Action label={`Khóa ${item.name}`} onClick={() => actions.onLock(item)}><Lock size={16} /></Action>;
  }
  if (canUnlockTerminal(item)) {
    return <Action label={`Mở khóa ${item.name}`} onClick={() => actions.onUnlock(item)}><Unlock size={16} /></Action>;
  }
  if (item.lockSource === "CASCADE") {
    return (
      <Action label={`Không thể mở khóa vì Master đang khóa: ${item.name}`} disabled>
        <Unlock size={16} />
      </Action>
    );
  }
  return <span className="inline-block w-8" />;
}

function TerminalRowActions({ item, actions }: { item: TerminalRow; actions: Actions }) {
  return (
    <div className="flex items-center gap-1">
      <Action label={`Xem chi tiết ${item.name}`} onClick={() => actions.onView(item)}><Eye size={16} /></Action>
      <Action label={`Sửa ${item.name}`} onClick={() => actions.onEdit(item)}><Edit size={16} /></Action>
      <LockAction item={item} actions={actions} />
    </div>
  );
}

export function getTerminalColumns(actions: Actions): ColumnDef<TerminalRow>[] {
  return [
    { accessorKey: "tid", header: "Terminal ID" },
    { accessorKey: "name", header: "Tên Terminal" },
    { accessorKey: "subMerchantName", header: "Sub-merchant" },
    { accessorKey: "address", header: "Địa chỉ", cell: ({ row }) => row.original.address || "—" },
    { id: "status", header: "Trạng thái", cell: ({ row }) => <Status row={row.original} /> },
    {
      id: "actions",
      header: "Thao tác",
      enableSorting: false,
      cell: ({ row }) => <TerminalRowActions item={row.original} actions={actions} />,
    },
  ];
}
