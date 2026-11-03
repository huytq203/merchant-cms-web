import "server-only";

import { merchantClient } from "@/lib/be/services";
import type { BeResult } from "@/lib/be/client";
import { revenueSeriesSchema, type RevenueGranularity, type RevenueSeries } from "@/features/dashboard/schemas/revenue.schema";

// Merchant Portal endpoint: scoped by the session (assigned Master or Subs); a Sub outside it answers 404.
// The BE caps the range at 92 days by day and 12 months by month.
const REVENUE_STATS = "/api/v1/merchant/revenue-stats";

export type RevenueRequest = { granularity: RevenueGranularity; from: string; to: string; subMerchantId?: string };

/** Revenue per Sub per Vietnam day or month of payment: gross, MDR fee and net recognised to the Sub. */
export function getRevenueSeries(request: RevenueRequest): Promise<BeResult<RevenueSeries>> {
  return merchantClient().get({ path: REVENUE_STATS, schema: revenueSeriesSchema, query: { ...request } });
}
