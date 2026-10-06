"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, KeyRound, LockKeyhole, LockKeyholeOpen, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { Badge } from "@/components/ui/badge/Badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip/Tooltip";
import { userStatusLabels } from "../constants/user.constants";
import type { MerchantUser } from "../schemas/user.schema";
import { canLockUser, canUnlockUser } from "../utils/user-mapper";

interface Actions {
  actorId: string;
  onView: (user: MerchantUser) => void;
  onEdit: (user: MerchantUser) => void;
  onLock: (user: MerchantUser) => void;
  onUnlock: (user: MerchantUser) => void;
  onReset: (user: MerchantUser) => void;
}

function ActionButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button type="button" variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function LockAction({ user, actions }: { user: MerchantUser; actions: Actions }) {
  if (canLockUser(user, actions.actorId)) {
    return (
      <ActionButton label={`Khoá ${user.fullName}`} onClick={() => actions.onLock(user)}>
        <LockKeyhole className="h-4 w-4" />
      </ActionButton>
    );
  }
  if (canUnlockUser(user)) {
    return (
      <ActionButton label={`Mở khoá ${user.fullName}`} onClick={() => actions.onUnlock(user)}>
        <LockKeyholeOpen className="h-4 w-4" />
      </ActionButton>
    );
  }
  return <span className="h-8 w-8" aria-hidden="true" />;
}

function UserActions({ user, actions }: { user: MerchantUser; actions: Actions }) {
  return (
    <div className="flex min-w-44 justify-center gap-1">
      <ActionButton label={`Xem chi tiết ${user.fullName}`} onClick={() => actions.onView(user)}>
        <Eye className="h-4 w-4" />
      </ActionButton>
      <ActionButton label={`Sửa ${user.fullName}`} onClick={() => actions.onEdit(user)}>
        <Pencil className="h-4 w-4" />
      </ActionButton>
      <LockAction user={user} actions={actions} />
      <ActionButton label={`Đặt lại mật khẩu ${user.fullName}`} onClick={() => actions.onReset(user)}>
        <KeyRound className="h-4 w-4" />
      </ActionButton>
    </div>
  );
}

const statusVariant = { PENDING: "soft-warning", ACTIVE: "soft-success", LOCKED: "soft-danger" } as const;

function StatusBadge({ status }: { status: MerchantUser["status"] }) {
  return (
    <Badge className="min-w-28 justify-center" variant={statusVariant[status]}>
      {userStatusLabels[status]}
    </Badge>
  );
}

export function buildUserColumns(actions: Actions): ColumnDef<MerchantUser>[] {
  return [
    { accessorKey: "email", header: "Email" },
    { accessorKey: "fullName", header: "Họ và tên" },
    { id: "status", header: "Trạng thái", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      id: "actions",
      header: "Thao tác",
      meta: { align: "center" },
      cell: ({ row }) => <UserActions user={row.original} actions={actions} />,
    },
  ];
}
