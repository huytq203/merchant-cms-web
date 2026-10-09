"use client";

import { Plus } from "lucide-react";
import { ResultCard } from "@/components/page/ResultCard";
import { ResultState } from "@/components/page/ResultState";
import { Button } from "@/components/ui/button/Button";
import { useUsers, type UserFilter } from "../user-queries";
import type { UserDialogsState } from "../hooks/use-user-dialogs";
import { UserTable } from "./UserTable";
import { userStatusOf } from "../utils/user-view";

type Props = {
  filter: UserFilter;
  actorId: string;
  openFor: UserDialogsState["openFor"];
  onPageChange: (page: number, pageSize: number) => void;
  onAdd: () => void;
};

export function UserResults({ filter, actorId, openFor, onPageChange, onAdd }: Props) {
  const list = useUsers(filter);

  return (
    <ResultCard>
      {list.isPending ? (
        <ResultState state="loading" />
      ) : list.isError ? (
        <ResultState state="error" errorMessage={list.error.message} onRetry={() => void list.refetch()} />
      ) : list.data.rows.length === 0 ? (
        <ResultState
          state="empty"
          emptyMessage="Không có người dùng phù hợp. Đổi bộ lọc hoặc thêm người dùng mới."
          action={
            <Button type="button" variant="solid" leftIcon={<Plus size={16} aria-hidden="true" />} onClick={onAdd}>
              Thêm người dùng
            </Button>
          }
        />
      ) : (
        <UserTable
          rows={list.data.rows}
          total={list.data.total}
          page={filter.page}
          pageSize={filter.pageSize}
          actorId={actorId}
          onPageChange={onPageChange}
          onView={(user) => openFor("detail", user)}
          onEdit={(user) => openFor("edit", user)}
          onLock={(user) => openFor("lock", user)}
          onUnlock={(user) => openFor("unlock", user)}
          onReset={(user) => openFor(userStatusOf(user) === "PENDING" ? "resend" : "reset", user)}
        />
      )}
    </ResultCard>
  );
}
