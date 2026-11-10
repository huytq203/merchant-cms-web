"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, KeyRound, LockKeyhole, LockKeyholeOpen, Mail, Pencil } from "lucide-react";
import { createIndexColumn } from "@/components/page/IndexColumn";
import { RowActions, type RowAction } from "@/components/page/RowActions";
import { StatusBadge } from "@/components/page/StatusBadge";
import { UserGroupChips } from "../components/UserGroupChips";
import { UserIdentity } from "../components/UserIdentity";
import { userStatusLabels } from "../constants/user.constants";
import type { MerchantUser } from "../schemas/user.schema";
import { getLockBlock, getResetPasswordBlock } from "../utils/user-restrictions";
import { labelOf, nameOf, userStatusOf } from "../utils/user-view";

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
  if (userStatusOf(user) === "LOCKED") {
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

/** Active users reset their password; users who never activated get a fresh activation mail instead. */
function credentialAction(user: MerchantUser, actions: Actions): RowAction {
  if (userStatusOf(user) === "PENDING") {
    return { label: "Gửi lại kích hoạt", icon: <Mail className={iconClass} />, onClick: () => actions.onReset(user) };
  }
  const blocked = getResetPasswordBlock(user, actions.actorId);
  return {
    label: "Đặt lại mật khẩu",
    icon: <KeyRound className={iconClass} />,
    disabled: Boolean(blocked),
    disabledReason: blocked,
    onClick: () => actions.onReset(user),
  };
}

function UserActions({ user, actions }: { user: MerchantUser; actions: Actions }) {
  return (
    <RowActions
      subject={labelOf(user)}
      actions={[
        { label: "Xem chi tiết", icon: <Eye className={iconClass} />, onClick: () => actions.onView(user) },
        { label: "Sửa", icon: <Pencil className={iconClass} />, onClick: () => actions.onEdit(user) },
        lockAction(user, actions),
        credentialAction(user, actions),
      ]}
    />
  );
}

const statusTone = { PENDING: "warning", ACTIVE: "success", LOCKED: "danger" } as const;

/** The three labels differ in length, so the badge gets one shared minimum width to line up in the column. */
function UserStatusBadge({ status }: { status: ReturnType<typeof userStatusOf> }) {
  return (
    <span className="inline-flex [&>span]:min-w-[0.1rem]">
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
      cell: ({ row }) => <UserIdentity name={nameOf(row.original)} email={row.original.email} />,
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
      cell: ({ row }) => {
        // The BE sends each group with its permission count; the catalog lookup is only the fallback for an older BE.
        const summaries = row.original.groupSummaries;
        if (summaries?.length) {
          return (
            <UserGroupChips
              names={summaries.map((group) => group.name)}
              permissionCounts={Object.fromEntries(summaries.map((group) => [group.name, group.permissionCount]))}
              limit={2}
            />
          );
        }
        return <UserGroupChips names={actions.groupNamesOf(row.original.groups)} limit={2} />;
      },
    },
    {
      id: "status",
      meta: { align: "center" },
      header: "Trạng thái",
      cell: ({ row }) => (
        <div className="flex flex-col items-center gap-1">
          <UserStatusBadge status={userStatusOf(row.original)} />
          {row.original.noMerchantScope ? <StatusBadge label="Không còn phạm vi" tone="warning" /> : null}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <span className="w-px whitespace-nowrap">Thao tác</span>,
      meta: { align: "center" },
      cell: ({ row }) => <UserActions user={row.original} actions={actions} />,
    },
  ];
}
