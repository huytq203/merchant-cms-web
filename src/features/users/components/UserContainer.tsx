"use client";

import { Plus } from "lucide-react";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import { Button } from "@/components/ui/button/Button";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import type { SessionMerchant } from "@/types/auth";
import { usePermissionGroups } from "@/features/permission/permission-group-queries";
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
  merchants?: SessionMerchant[];
  actorId: string;
  canApproveScope: boolean;
}

export function UserContainer({ filter, merchantIds, merchants, actorId, canApproveScope }: Props) {
  const dialogs = useUserDialogs();
  const actions = useUserActions(dialogs.close);
  const navigation = useUserListNavigation(filter);
  const merchantId = filter.merchantId ?? merchantIds[0] ?? "";
  // Choices of the "Nhóm quyền" and "Phạm vi" filters. A failed load only empties the list: the filter still works for "Tất cả".
  // System groups plus the Master's own groups, narrowed to the chosen merchant when there is one.
  const groups = usePermissionGroups({ page: 1, pageSize: 100, ...(filter.merchantId ? { merchantId: filter.merchantId } : {}) });
  const subMerchants = useSubMerchantOptions(filter.merchantId);
  const groupOptions = (groups.data?.rows ?? []).map((group) => ({ value: group.id, label: `${group.name} · ${group.permissions.length} quyền` }));
  const subMerchantOptions = (subMerchants.data ?? []).map((sub) => ({ value: sub.id, label: `${sub.code} · ${sub.name}` }));
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
        key={`${filter.query ?? ""}:${filter.status ?? ""}:${filter.merchantId ?? ""}:${filter.permissionGroupId ?? ""}:${filter.scope ?? ""}`}
        filter={filter}
        merchantIds={merchantIds}
        merchants={merchants}
        groupOptions={groupOptions}
        subMerchantOptions={subMerchantOptions}
        onSearch={navigation.search}
      />
      <UserResults filter={filter} actorId={actorId} openFor={openFor} onPageChange={navigation.changePage} onAdd={openCreate} />
      <UserDialogs
        dialogs={dialogs}
        openFor={openFor}
        actions={actions}
        merchantId={merchantId}
        merchantIds={merchantIds}
        merchants={merchants}
        actorId={actorId}
        canApproveScope={canApproveScope}
      />
    </div>
  );
}
