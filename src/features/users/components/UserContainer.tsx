"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import type { UserFilter } from "../user-queries";
import { useUserActions } from "../hooks/use-user-actions";
import { useUserDialogs } from "../hooks/use-user-dialogs";
import { useUserListNavigation } from "../hooks/use-user-list-navigation";
import { UserDialogs } from "./UserDialogs";
import { UserFilter as UserFilters } from "./UserFilter";
import { UserResults } from "./UserResults";

interface Props {
  filter: UserFilter;
  merchantIds: string[];
  actorId: string;
}

export function UserContainer({ filter, merchantIds, actorId }: Props) {
  const dialogs = useUserDialogs();
  const actions = useUserActions(dialogs.close);
  const navigation = useUserListNavigation(filter);
  const merchantId = filter.merchantId ?? merchantIds[0] ?? "";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Quản lý người dùng</h1>
        <Button type="button" variant="solid" leftIcon={<Plus size={16} />} onClick={dialogs.openCreate}>
          Thêm người dùng
        </Button>
      </header>
      <UserFilters
        key={`${filter.query ?? ""}:${filter.status ?? ""}:${filter.merchantId ?? ""}`}
        filter={filter}
        merchantIds={merchantIds}
        onSearch={navigation.search}
      />
      <section className="rounded-xl border border-border bg-background p-4" aria-label="Danh sách người dùng">
        <h2 className="mb-4 font-semibold">Danh sách người dùng</h2>
        <UserResults
          filter={filter}
          actorId={actorId}
          openFor={dialogs.openFor}
          onPageChange={navigation.changePage}
        />
      </section>
      <UserDialogs
        dialogs={dialogs}
        actions={actions}
        merchantId={merchantId}
        actorId={actorId}
      />
    </div>
  );
}
