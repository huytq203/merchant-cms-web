import "server-only";

import type { BeResult } from "@/lib/be/client";
import { ok } from "@/lib/http/result";
import type { ResolvedSettlementFilter, SettlementListResult } from "@/features/settlement-items/types";
import { getSettlementTotals, listSettlementItems } from "./settlement-item.service";

/** The page and its totals are independent BE calls, so they run together; either failure fails the list. */
export async function readSettlementList(filter: ResolvedSettlementFilter): Promise<BeResult<SettlementListResult>> {
  const [list, totals] = await Promise.all([listSettlementItems(filter), getSettlementTotals(filter)]);
  if (!list.success) return list;
  if (!totals.success) return totals;
  return ok({ ...list.data, totals: totals.data });
}
