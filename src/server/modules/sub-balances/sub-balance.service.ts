import "server-only";

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

/** The ledger movements of the Sub's available balance, paged. BE page is 1-based; the order is newest first. */
export async function listSubBalanceMovements(subMerchantId: string, filter: MovementFilter): Promise<BeResult<MovementListResult>> {
  const result = await merchantClient().get({
    path: `${SUB_BALANCES}/${encodeURIComponent(subMerchantId)}/movements`,
    schema: pageSchema(movementSchema),
    query: { type: filter.type, fromDate: filter.fromDate, toDate: filter.toDate, page: filter.page, size: filter.size },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}

/** One movement with its breakdown lines; the BE answers 404 for an operation that is not this Sub's. */
export function getSubBalanceMovement(subMerchantId: string, operationId: string): Promise<BeResult<MovementDetail>> {
  return merchantClient().get({
    path: `${SUB_BALANCES}/${encodeURIComponent(subMerchantId)}/movements/${encodeURIComponent(operationId)}`,
    schema: movementDetailSchema,
  });
}
