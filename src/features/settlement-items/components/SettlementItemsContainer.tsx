"use client";

import { useState } from "react";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import type { SubMerchantChoice } from "@/features/sub-merchants/utils/sub-merchant-choice";
import { useSettlementNavigation } from "../hooks/use-settlement-navigation";
import type { ResolvedSettlementFilter, SettlementItem } from "../types";
import { SettlementDetailSheet } from "./SettlementDetailSheet";
import { SettlementFilter } from "./SettlementFilter";
import { SettlementResults } from "./SettlementResults";

interface Props {
  filter: ResolvedSettlementFilter;
  choices: SubMerchantChoice[];
  canFilterTerminal: boolean;
}

export function SettlementItemsContainer({ filter, choices, canFilterTerminal }: Props) {
  const [selected, setSelected] = useState<SettlementItem | null>(null);
  const navigation = useSettlementNavigation(filter);

  return (
    <div className="space-y-5">
      <PageHeader
        title={getRouteTitle("/settlement-items")}
        description="Mỗi đơn hàng thanh toán thành công chia thành Đợt 1 và Đợt tạm giữ. Đơn hàng mới có thể mất vài phút mới hiện."
      />
      <SettlementFilter
        key={`${filter.subMerchantId}|${filter.terminalId}|${filter.trancheStatus}|${filter.paidFrom}|${filter.paidTo}`}
        initial={filter}
        choices={choices}
        canFilterTerminal={canFilterTerminal}
        onSearch={navigation.search}
        onClear={navigation.clear}
      />
      <SettlementResults filter={filter} onPageChange={navigation.changePage} onView={setSelected} onPickSub={navigation.pickSub} />
      <SettlementDetailSheet row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
