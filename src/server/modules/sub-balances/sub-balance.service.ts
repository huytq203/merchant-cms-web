import "server-only";

import { merchantClient } from "@/lib/be/services";
import type { BeResult } from "@/lib/be/client";
import { subBalanceReportSchema } from "@/features/sub-balances/schemas";
import type { SubBalanceReport } from "@/features/sub-balances/types";

// Merchant Portal endpoint: the BE reads the ledger on every call and answers 503 when it cannot,
// and 404 for a Sub outside the session scope.
const SUB_BALANCES = "/api/v1/merchant/sub-balances";

export function getSubBalance(subMerchantId: string): Promise<BeResult<SubBalanceReport>> {
  return merchantClient().get({ path: `${SUB_BALANCES}/${encodeURIComponent(subMerchantId)}`, schema: subBalanceReportSchema });
}
