import "server-only";

import { merchantClient } from "@/lib/be/services";
import type { BeResult } from "@/lib/be/client";
import { freezeListSchema } from "@/features/revenue-freezes/schemas";
import type { FreezeStatusFilter, RevenueFreeze } from "@/features/revenue-freezes/types";

// Merchant Portal endpoint (VIEW_BALANCE). The BE limits the rows to the session's own Subs: a Sub outside the
// scope answers an empty list, not 404. Read-only: freezing and releasing are done by FlexPay.
const REVENUE_FREEZES = "/api/v1/merchant/revenue-freezes";

/** Freezes of one Sub, newest first; ALL sends no status so the BE returns every state. */
export function listRevenueFreezes(subMerchantId: string, status: FreezeStatusFilter): Promise<BeResult<RevenueFreeze[]>> {
  return merchantClient().get({
    path: REVENUE_FREEZES,
    schema: freezeListSchema,
    query: { subId: subMerchantId, status: status === "ALL" ? undefined : status },
  });
}
