"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, KeyRound, LockKeyhole, LockKeyholeOpen, Pencil } from "lucide-react";
import { createIndexColumn } from "@/components/page/IndexColumn";
import { RowActions, type RowAction } from "@/components/page/RowActions";
import { StatusBadge } from "@/components/page/StatusBadge";
import { UserGroupChips } from "../components/UserGroupChips";
import { UserIdentity } from "../components/UserIdentity";
import { userStatusLabels } from "../constants/user.constants";
import type { MerchantUser } from "../schemas/user.schema";
import { getLockBlock, getResetPasswordBlock } from "../utils/user-restrictions";

interface Actions {
  actorId: string;
  groupNamesOf: (groupIds: string[]) => string[];
  onView: (user: MerchantUser) => void;
  onEdit: (user: MerchantUser) => void;
  onLock: (user: MerchantUser) => void;
  onUnlock: (user: MerchantUser) => void;
  onReset: (user: MerchantUser) => void;
}

const iconClass = "h-4 w-4";

function lockAction(user: MerchantUser, actions: Actions): RowAction {
  const blocked = getLockBlock(user, actions.actorId);
  if (user.status === "LOCKED") {
    return { label: "Mở khóa", icon: <LockKeyholeOpen className={iconClass} />, onClick: () => actions.onUnlock(user) };
  }
  return {
    label: "Khóa",
    icon: <LockKeyhole className={iconClass} />,
    disabled: Boolean(blocked),
    disabledReason: blocked,
    onClick: () => actions.onLock(user),
  };
}

function UserActions({ user, actions }: { user: MerchantUser; actions: Actions }) {
  const resetBlock = getResetPasswordBlock(user, actions.actorId);

  return (
    <RowActions
      subject={user.fullName}
      actions={[
        { label: "Xem chi tiết", icon: <Eye className={iconClass} />, onClick: () => actions.onView(user) },
        { label: "Sửa", icon: <Pencil className={iconClass} />, onClick: () => actions.onEdit(user) },
        lockAction(user, actions),
        {
          label: "Đặt lại mật khẩu",
          icon: <KeyRound className={iconClass} />,
          disabled: Boolean(resetBlock),
          disabledReason: resetBlock,
          onClick: () => actions.onReset(user),
        },
      ]}
    />
  );
}

const statusTone = { PENDING: "warning", ACTIVE: "success", LOCKED: "danger" } as const;

/** The three labels differ in length, so the badge gets one shared minimum width to line up in the column. */
function UserStatusBadge({ status }: { status: MerchantUser["status"] }) {
  return (
    <span className="inline-flex [&>span]:min-w-[7.5rem]">
      <StatusBadge label={userStatusLabels[status]} tone={statusTone[status]} />
    </span>
  );
}

export function buildUserColumns(actions: Actions, page: number, pageSize: number): ColumnDef<MerchantUser>[] {
  return [
    createIndexColumn<MerchantUser>({ page, pageSize }),
    {
      id: "user",
      header: "Người dùng",
      cell: ({ row }) => <UserIdentity name={row.original.fullName} email={row.original.email} />,
    },
    {
      id: "phone",
      header: "Số điện thoại",
      cell: ({ row }) => row.original.phone
        ? <span className="tabular-nums">{row.original.phone}</span>
        : <span className="text-muted-foreground">Chưa có</span>,
    },
    {
      id: "groups",
      header: "Nhóm quyền",
      cell: ({ row }) => <UserGroupChips names={actions.groupNamesOf(row.original.groupIds)} limit={2} />,
    },
    {
      id: "status",
      meta: { align: "center" },
      header: "Trạng thái",
      cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: () => <span className="w-px whitespace-nowrap">Thao tác</span>,
      meta: { align: "center" },
      cell: ({ row }) => <UserActions user={row.original} actions={actions} />,
    },
  ];
}
