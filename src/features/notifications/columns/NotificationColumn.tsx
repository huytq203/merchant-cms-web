import type { ColumnDef } from "@tanstack/react-table";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge/Badge";
import { RowActions } from "@/components/page/RowActions";
import { cn } from "@/lib/utils/cn";
import { formatVnDateTime } from "@/lib/utils/vn-time";
import type { Notification } from "../types";

/**
 * Inbox table: state badge (text, not colour only), the BE-formatted Vietnamese title/body verbatim,
 * time in Vietnam time, and one fixed icon slot to mark the row read (disabled once read).
 */
export function notificationColumns(onMarkRead: (row: Notification) => void): ColumnDef<Notification>[] {
  return [
    {
      id: "state",
      header: "Trạng thái",
      enableSorting: false,
      cell: ({ row }) => (row.original.readAt === null
        ? <Badge variant="soft-primary" className="w-20">Chưa đọc</Badge>
        : <Badge variant="secondary" className="w-20">Đã đọc</Badge>),
    },
    {
      id: "content",
      header: "Nội dung",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="min-w-56 max-w-xl space-y-0.5">
          <p className={cn("text-sm text-foreground", row.original.readAt === null && "font-semibold")}>{row.original.title}</p>
          <p className="text-sm text-muted-foreground">{row.original.body}</p>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Thời gian",
      enableSorting: false,
      cell: ({ row }) => (
        <time className="whitespace-nowrap tabular-nums" dateTime={row.original.createdAt}>
          {formatVnDateTime(row.original.createdAt)}
        </time>
      ),
    },
    {
      id: "actions",
      header: () => <span className="w-px whitespace-nowrap">Thao tác</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <RowActions
          subject={row.original.title}
          actions={[{
            label: "Đánh dấu đã đọc",
            icon: <Check size={16} />,
            onClick: () => onMarkRead(row.original),
            disabled: row.original.readAt !== null,
            disabledReason: "Đã đọc",
          }]}
        />
      ),
    },
  ];
}
