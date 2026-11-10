"use client";

import { useQuery } from "@tanstack/react-query";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { useWithdrawalDialogs } from "../hooks/use-withdrawal-dialogs";
import { useWithdrawalListNavigation } from "../hooks/use-withdrawal-list-navigation";
import { withdrawalQueries } from "../withdrawal-queries";
import type { WithdrawalListFilter } from "../types/types";
import { WithdrawalCreateModal } from "./WithdrawalCreateModal";
import { WithdrawalDetailModal } from "./WithdrawalDetailModal";
import { WithdrawalFilter } from "./WithdrawalFilter";
import { WithdrawalResults } from "./WithdrawalResults";

const filterKey = (filter: WithdrawalListFilter) =>
  [filter.transactionCode, filter.statusGroup, filter.createdFrom, filter.createdTo].map((part) => part ?? "").join(":");

type Props = {
  filter: WithdrawalListFilter;
  abilities: { canCreate: boolean };
  /** Sub người dùng được chọn khi tạo yêu cầu rút; server dựng theo phạm vi gán của phiên. */
  subChoices?: readonly { id: string; label: string }[];
};

export function WithdrawalsContainer({ filter, abilities, subChoices = [] }: Props) {
  const dialogs = useWithdrawalDialogs();
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
        onOpenChange={(open) => !open && dialogs.close()}
        listed={dialogs.target}
      />
    </div>
  );
}
