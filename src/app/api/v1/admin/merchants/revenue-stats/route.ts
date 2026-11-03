import { NextResponse } from "next/server";
import { revenueQuerySchema } from "@/features/dashboard/schemas/revenue.schema";
import { vnDay } from "@/features/dashboard/utils/order-week";
import { revenueRange } from "@/features/dashboard/utils/revenue-series";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import { requirePermission } from "@/server/auth/require-permission";
import { getRevenueSeries } from "@/server/modules/revenue-stats/revenue-stats.service";

/**
 * Dashboard revenue per Sub-merchant. Gated like the settlement items it is built from (VIEW_BALANCE). The
 * range is always the latest 30 Vietnam days or 12 months, computed here so every client agrees on "today".
 */
export async function GET(request: Request) {
  const access = await requirePermission("VIEW_BALANCE");
  if (!access.ok) return access.response;
  const query = revenueQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return NextResponse.json({ message: "Tham số không hợp lệ" }, { status: 400 });
  const { granularity, subMerchantId } = query.data;
  const { from, to } = revenueRange(granularity, vnDay(new Date().toISOString()) as string);
  const result = await getRevenueSeries({ granularity, from, to, ...(subMerchantId ? { subMerchantId } : {}) });
  if (!result.success) {
    return NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
  }
  return NextResponse.json(result.data);
}
