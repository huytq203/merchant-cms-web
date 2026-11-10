import "server-only";

import { pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import type { BeResult } from "@/lib/be/client";
import { ok } from "@/lib/http/result";
import { trancheStatusesOf } from "@/features/settlement-items/constants/settlement-labels";
import { settlementItemDetailSchema, settlementItemSchema, settlementTotalsSchema } from "@/features/settlement-items/schemas";
import type {
  ResolvedSettlementFilter,
  SettlementItem,
  SettlementItemDetail,
  SettlementTotals,
} from "@/features/settlement-items/types";

// Merchant Portal endpoints: paidFrom + paidTo are mandatory, order is fixed to paidAt desc, and a Sub outside the
// session scope answers 404. Mục 11 (BE MR A): không gửi Sub = mọi Sub trong phạm vi phiên; lọc thêm terminalId và
// trancheStatus (danh sách trạng thái BE, phân tách dấu phẩy).
const SETTLEMENT_ITEMS = "/api/v1/merchant/settlement-items";

const rangeQuery = (filter: ResolvedSettlementFilter) => ({
  subMerchantId: filter.subMerchantId,
  terminalId: filter.terminalId,
  trancheStatus: filter.trancheStatus ? trancheStatusesOf(filter.trancheStatus) : undefined,
  paidFrom: filter.paidFrom,
  paidTo: filter.paidTo,
});

export async function listSettlementItems(filter: ResolvedSettlementFilter): Promise<BeResult<{ rows: SettlementItem[]; total: number }>> {
  const result = await merchantClient().get({
    path: SETTLEMENT_ITEMS,
    schema: pageSchema(settlementItemSchema),
    query: { ...rangeQuery(filter), page: filter.page, size: filter.pageSize },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}

export function getSettlementTotals(filter: ResolvedSettlementFilter): Promise<BeResult<SettlementTotals>> {
  return merchantClient().get({ path: `${SETTLEMENT_ITEMS}/totals`, schema: settlementTotalsSchema, query: rangeQuery(filter) });
}

export function getSettlementItem(id: string): Promise<BeResult<SettlementItemDetail>> {
  return merchantClient().get({ path: `${SETTLEMENT_ITEMS}/${encodeURIComponent(id)}`, schema: settlementItemDetailSchema });
}

