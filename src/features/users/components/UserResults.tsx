"use client";

import { Button } from "@/components/ui/button/Button";
import { useUsers, type UserFilter } from "../user-queries";
import type { UserDialogsState } from "../hooks/use-user-dialogs";
import { UserResultsSkeleton } from "./UserResultsSkeleton";
import { UserTable } from "./UserTable";

type Props = {
  filter: UserFilter;
  actorId: string;
  openFor: UserDialogsState["openFor"];
  onPageChange: (page: number, pageSize: number) => void;
};

export function UserResults({ filter, actorId, openFor, onPageChange }: Props) {
  const list = useUsers(filter);

  if (list.isPending) return <UserResultsSkeleton />;
  if (list.isError) {
    return (
      <div role="alert">
        <p>{list.error.message}</p>
        <Button type="button" variant="outline" onClick={() => void list.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }
  if (list.data.rows.length === 0) {
    return <p className="py-12 text-center text-muted-foreground">Chưa có người dùng</p>;
  }
  return (
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
      onReset={(user) => openFor("reset", user)}
    />
  );
}
