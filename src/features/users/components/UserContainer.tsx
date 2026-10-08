"use client";

import { Plus } from "lucide-react";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import { Button } from "@/components/ui/button/Button";
import type { UserFilter } from "../user-queries";
import { useUserActions } from "../hooks/use-user-actions";
import { useUserDialogs, type UserDialogsState } from "../hooks/use-user-dialogs";
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
  const openCreate = () => {
    actions.clearFeedback();
    dialogs.openCreate();
  };
  const openFor: UserDialogsState["openFor"] = (dialog, user) => {
    actions.clearFeedback();
    dialogs.openFor(dialog, user);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={getRouteTitle("/users")}
        action={
          <Button type="button" variant="solid" leftIcon={<Plus size={16} aria-hidden="true" />} onClick={openCreate}>
            Thêm người dùng
          </Button>
        }
      />
      <UserFilters
        key={`${filter.query ?? ""}:${filter.status ?? ""}:${filter.merchantId ?? ""}`}
        filter={filter}
        merchantIds={merchantIds}
        onSearch={navigation.search}
      />
      <UserResults filter={filter} actorId={actorId} openFor={openFor} onPageChange={navigation.changePage} onAdd={openCreate} />
      <UserDialogs
        dialogs={dialogs}
        openFor={openFor}
        actions={actions}
        merchantId={merchantId}
        merchantIds={merchantIds}
        actorId={actorId}
      />
    </div>
  );
}
