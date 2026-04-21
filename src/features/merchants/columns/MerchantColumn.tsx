import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";
import { Eye, Lock, Pencil, Unlock } from "lucide-react";
import Link from "next/link";
import { Merchant } from "../types";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge/Badge";
import { MERCHANT_STATUS_OPTIONS, MERCHANT_TYPE_OPTIONS } from "../constants/Merchant.constants";
import { Text } from "@/components/ui";

function formatBalance(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " vnđ";
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  try {
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm");
  } catch {
    return null;
  }
}

function maskPhone(phone: string | null) {
  if (!phone) return "";
  if (phone.length <= 6) return phone;
  return phone.slice(0, 3) + "xxxx" + phone.slice(-3);
}

export const getColumn = (
  setLockTarget: (
    target: { merchant: Merchant; action: "lock" | "unlock" } | null,
  ) => void,
): ColumnDef<Merchant>[] => {
  return [
    {
      id: "code",
      header: "Mã MC",
      cell: ({ row }) => (
        <Link
          href={`/merchants/${row.original.id}`}
          className="font-bold text-primary hover:underline"
        >
          {row.original.code}
        </Link>
      ),
      size: 110,
    },
    {
      id: "merchant",
      header: "Merchant & Lĩnh vực",
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate max-w-[200px]">
              {m.name ?? (
                <span className="italic text-muted-foreground">
                  Chưa khai báo
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {m.businessTypeName ?? "—"}
            </p>
          </div>
        );
      },
      size: 220,
    },
    {
      id: "type",
      header: "Phân loại",
      cell: ({ row }) => {
        const type = row.original.merchantType;
        const option = MERCHANT_TYPE_OPTIONS.find((x) => x.value === type);
        return (
          <Badge variant={option?.variant || "text-danger"}>
            {(option?.label ?? type) || <Text italic className="text-danger">Chưa khai báo</Text>}
          </Badge>
        );
      },
      size: 110,
    },
    {
      id: "sales",
      header: "Sales phụ trách",
      cell: ({ row }) => {
        const m = row.original;
        if (!m.salesStaffName) {
          return <span className="text-xs text-red-400 italic">Chưa gán</span>;
        }
        return <span className="text-sm">{m.salesStaffName}</span>;
      },
      size: 140,
    },
    {
      id: "phone",
      header: "Liên hệ",
      cell: ({ row }) => (
        <span className="text-sm font-mono">
          {maskPhone(row.original.phone)}
        </span>
      ),
      size: 120,
    },
    {
      id: "dates",
      header: "Thời gian",
      cell: ({ row }) => {
        const m = row.original;
        const activated = formatDate(m.activatedAt);
        return (
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">
              Tạo:{" "}
              <span className="text-foreground">
                {formatDate(m.registeredAt)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              KH:{" "}
              {activated ? (
                <span className="text-foreground">{activated}</span>
              ) : (
                <span className="italic text-muted-foreground">
                  Chưa kích hoạt
                </span>
              )}
            </p>
          </div>
        );
      },
      size: 160,
    },
    {
      id: "balance",
      header: "Số dư ví",
      meta: { align: "right" },
      cell: ({ row }) => {
        const balance = row.original.walletBalance;
        return (
          <span
            className={cn(
              "text-sm font-mono font-medium",
              balance > 0
                ? "text-emerald-600"
                : balance < 0
                  ? "text-red-600"
                  : "text-foreground",
            )}
          >
            {formatBalance(balance)}
          </span>
        );
      },
      size: 140,
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.original.status;
        const option = MERCHANT_STATUS_OPTIONS.find((x) => x.value === status);
        return (
          <Badge variant={option?.variant || "text-danger"}>
            {(option?.label ?? status) || <Text italic>Chưa khai báo</Text>}
          </Badge>
        );
      },
      size: 120,
    },
    {
      id: "actions",
      header: "",
      meta: { align: "center" },
      cell: ({ row }) => {
        const m = row.original;
        const isLocked = m.status === "locked";
        return (
          <div className="flex items-center justify-center gap-1">
            <Link
              href={`/merchants/${m.id}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
              title="Xem hồ sơ"
            >
              <Eye className="h-4 w-4" />
            </Link>
            <Link
              href={`/merchants/${m.id}/edit`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
              title="Chỉnh sửa"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              type="button"
              title={isLocked ? "Mở khóa" : "Khóa ví"}
              onClick={() =>
                setLockTarget({
                  merchant: m,
                  action: isLocked ? "unlock" : "lock",
                })
              }
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                isLocked
                  ? "text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                  : "text-muted-foreground hover:text-red-600 hover:bg-red-50",
              )}
            >
              {isLocked ? (
                <Unlock className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
            </button>
          </div>
        );
      },
      size: 100,
      enableSorting: false,
    },
  ];
};
