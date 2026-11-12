"use client";

import { useMemo, useState } from "react";
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
  // Sub chọn được ở ô lọc. /choices chỉ gồm Sub đang hoạt động, nên Sub có doanh thu mà vắng ở đây là Sub đã khóa.
  // Danh sách rỗng (BE chưa trả được tên) thì coi là chưa biết, không khóa nhầm mọi Sub.
  const pickableSubIds = useMemo(() => (choices.length > 0 ? new Set(choices.map((choice) => choice.id)) : undefined), [choices]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={getRouteTitle("/settlement-items")}
        description="Mỗi đơn hàng thanh toán thành công chia thành Đợt 1 và Đợt tạm giữ. Đơn hàng mới có thể mất vài phút mới hiện."
      />
      <SettlementFilter
        key={`${(filter.subMerchantIds ?? []).join(",")}|${filter.terminalId}|${filter.trancheStatus}|${filter.paidFrom}|${filter.paidTo}`}
        initial={filter}
        canFilterTerminal={canFilterTerminal}
        onSearch={navigation.search}
        onClear={navigation.clear}
      />
      <SettlementResults filter={filter} onPageChange={navigation.changePage} onView={setSelected} onPickSub={navigation.pickSub} pickableSubIds={pickableSubIds} />
      <SettlementDetailSheet row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
