import "server-only";

import { pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import type { BeResult } from "@/lib/be/client";
import { ok } from "@/lib/http/result";
import { settlementItemDetailSchema, settlementItemSchema, settlementTotalsSchema } from "@/features/settlement-items/schemas";
import type {
  ResolvedSettlementFilter,
  SettlementItem,
  SettlementItemDetail,
  SettlementTotals,
} from "@/features/settlement-items/types";

// Merchant Portal endpoints: Sub + paidFrom + paidTo are mandatory (the BE answers 500 when one is
// missing), order is fixed to paidAt desc, and a Sub outside the session scope answers 404.
const SETTLEMENT_ITEMS = "/api/v1/merchant/settlement-items";

const rangeQuery = (filter: ResolvedSettlementFilter) => ({
  subMerchantId: filter.subMerchantId,
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

