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
}

export function SettlementItemsContainer({ filter, choices }: Props) {
  const [selected, setSelected] = useState<SettlementItem | null>(null);
  const navigation = useSettlementNavigation(filter);

  return (
    <div className="space-y-5">
      <PageHeader
        title={getRouteTitle("/settlement-items")}
        description="Mỗi giao dịch thành công chia thành Đợt 1 và Đợt tạm giữ. Giao dịch mới có thể mất vài phút mới hiện."
      />
      <SettlementFilter
        key={`${filter.subMerchantId}|${filter.paidFrom}|${filter.paidTo}`}
        initial={filter}
        choices={choices}
        onSearch={navigation.search}
        onClear={navigation.clear}
      />
      <SettlementResults filter={filter} onPageChange={navigation.changePage} onView={setSelected} />
      <SettlementDetailSheet row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
