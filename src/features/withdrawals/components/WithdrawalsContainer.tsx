"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { useWithdrawalDialogs } from "../hooks/use-withdrawal-dialogs";
import { useWithdrawalListNavigation } from "../hooks/use-withdrawal-list-navigation";
import { withdrawalQueries } from "../withdrawal-queries";
import type { WithdrawalListFilter } from "../types/types";
import { WithdrawalCreateModal } from "./WithdrawalCreateModal";
import { WithdrawalDetailModal } from "./WithdrawalDetailModal";
import { WithdrawalResults } from "./WithdrawalResults";

type Props = {
  filter: WithdrawalListFilter;
  abilities: { canCreate: boolean };
};

export function WithdrawalsContainer({ filter, abilities }: Props) {
  const dialogs = useWithdrawalDialogs();
  const navigation = useWithdrawalListNavigation(filter);
  const list = useQuery(withdrawalQueries.list(filter));

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Giao dịch rút tiền</h1>
        {abilities.canCreate && (
          <Button type="button" variant="solid" onClick={dialogs.openCreate}>
            <Plus size={16} aria-hidden="true" /> Tạo yêu cầu rút tiền
          </Button>
        )}
      </header>
      {/* The filter card is hidden: the BE withdrawal search accepts no filter, so it would be fake. */}
      <section className="rounded-xl border bg-card p-4" aria-label="Kết quả tìm kiếm">
        <h2 className="mb-3 font-semibold">Kết quả tìm kiếm {list.data ? `(${list.data.total})` : ""}</h2>
        <WithdrawalResults
          list={list}
          filter={filter}
          onPageChange={navigation.changePage}
          onView={dialogs.openDetail}
        />
      </section>
      {dialogs.activeDialog === "create" && <WithdrawalCreateModal onClose={dialogs.close} />}
      <WithdrawalDetailModal
        open={dialogs.activeDialog === "detail"}
        onOpenChange={(open) => !open && dialogs.close()}
        listed={dialogs.target}
      />
    </div>
  );
}
