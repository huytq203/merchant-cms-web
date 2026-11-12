"use client";

import { useQuery } from "@tanstack/react-query";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { DetailDeepLink } from "@/components/modal";
import { useDetailParam } from "@/hooks/use-detail-param";
import { useWithdrawalDialogs } from "../hooks/use-withdrawal-dialogs";
import { useWithdrawalListNavigation } from "../hooks/use-withdrawal-list-navigation";
import { withdrawalQueries } from "../withdrawal-queries";
import type { WithdrawalListFilter } from "../types/types";
import { WithdrawalCreateModal } from "./WithdrawalCreateModal";
import { WithdrawalDetailModal } from "./WithdrawalDetailModal";
import { WithdrawalFilter } from "./WithdrawalFilter";
import { WithdrawalResults } from "./WithdrawalResults";

const filterKey = (filter: WithdrawalListFilter) =>
  [filter.transactionCode, filter.statusGroup, (filter.subMerchantIds ?? []).join(","), filter.createdFrom, filter.createdTo].map((part) => part ?? "").join(":");

type Props = {
  filter: WithdrawalListFilter;
  abilities: { canCreate: boolean };
  /** Sub người dùng được chọn khi tạo yêu cầu rút; server dựng theo phạm vi gán của phiên. */
  subChoices?: readonly { id: string; label: string }[];
};

export function WithdrawalsContainer({ filter, abilities, subChoices = [] }: Props) {
  const dialogs = useWithdrawalDialogs();
  const { closeDetail } = useDetailParam();
  const navigation = useWithdrawalListNavigation(filter);
  const list = useQuery(withdrawalQueries.list(filter));

  return (
    <div className="space-y-5">
      <PageHeader
        title={getRouteTitle("/withdrawal")}
        action={abilities.canCreate ? (
          <Button type="button" variant="solid" onClick={dialogs.openCreate}>
            <Plus size={16} aria-hidden="true" /> Tạo yêu cầu rút tiền
          </Button>
        ) : undefined}
      />
      <WithdrawalFilter key={filterKey(filter)} initial={filter} onSearch={navigation.search} />
      <WithdrawalResults
        list={list}
        filter={filter}
        onPageChange={navigation.changePage}
        onView={dialogs.openDetail}
      />
      {dialogs.activeDialog === "create" && <WithdrawalCreateModal onClose={dialogs.close} onViewDetail={dialogs.openDetail} subChoices={subChoices} />}
      <WithdrawalDetailModal
        open={dialogs.activeDialog === "detail"}
        onOpenChange={(open) => {
          if (open) return;
          dialogs.close();
          closeDetail();
        }}
        listed={dialogs.target}
      />
      {/* `?detail=<id>` từ thông báo/push: tải yêu cầu rồi mở hộp chi tiết ở trên. */}
      <DetailDeepLink query={withdrawalQueries.detail} onLoaded={dialogs.openDetail} />
    </div>
  );
}
