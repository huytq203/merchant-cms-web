import "server-only";

import { z } from "zod";
import { merchantClient } from "@/lib/be/services";
import type { BeResult } from "@/lib/be/client";
import { subBalanceReportSchema } from "@/features/sub-balances/schemas";
import type { SubBalanceReport } from "@/features/sub-balances/types";
import { pageSchema } from "@/lib/be/envelope";
import { ok } from "@/lib/http/result";
import { movementDetailSchema, movementSchema } from "@/features/sub-balances/movement-schemas";
import type { MovementDetail, MovementFilter, MovementListResult } from "@/features/sub-balances/movement-types";

// Merchant Portal endpoint: the BE reads the ledger on every call and answers 503 when it cannot,
// and 404 for a Sub outside the session scope.
const SUB_BALANCES = "/api/v1/merchant/sub-balances";

export function getSubBalance(subMerchantId: string): Promise<BeResult<SubBalanceReport>> {
  return merchantClient().get({ path: `${SUB_BALANCES}/${encodeURIComponent(subMerchantId)}`, schema: subBalanceReportSchema });
}

/** The page plus the period totals the BE sends next to it (10/11/2026); all optional so an older BE still parses. */
const movementPageSchema = pageSchema(movementSchema).extend({
  openingBalance: z.number().nullish(),
  totalIn: z.number().nullish(),
  totalOut: z.number().nullish(),
  closingBalance: z.number().nullish(),
  totalsComplete: z.boolean().nullish(),
});

/** The ledger movements of the Sub's available balance, paged. BE page is 1-based; the order is newest first. */
export async function listSubBalanceMovements(subMerchantId: string, filter: MovementFilter): Promise<BeResult<MovementListResult>> {
  const result = await merchantClient().get({
    path: `${SUB_BALANCES}/${encodeURIComponent(subMerchantId)}/movements`,
    schema: movementPageSchema,
    query: { type: filter.type, fromDate: filter.fromDate, toDate: filter.toDate, page: filter.page, size: filter.size },
  });
  if (!result.success) return result;
  const page = result.data;
  // Without opening and closing balance there is nothing truthful to show: no strip rather than zeros.
  const summary = page.openingBalance == null || page.closingBalance == null ? null : {
    openingBalance: page.openingBalance,
    totalIn: page.totalIn ?? null,
    totalOut: page.totalOut ?? null,
    closingBalance: page.closingBalance,
    totalsComplete: page.totalsComplete ?? (page.totalIn != null && page.totalOut != null),
  };
  return ok({ rows: page.content, total: page.totalElements, summary });
}

/** One movement with its breakdown lines; the BE answers 404 for an operation that is not this Sub's. */
export function getSubBalanceMovement(subMerchantId: string, operationId: string): Promise<BeResult<MovementDetail>> {
  return merchantClient().get({
    path: `${SUB_BALANCES}/${encodeURIComponent(subMerchantId)}/movements/${encodeURIComponent(operationId)}`,
    schema: movementDetailSchema,
  });
}
