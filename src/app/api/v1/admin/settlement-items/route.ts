import { NextResponse } from "next/server";
import { settlementFilterSchema } from "@/features/settlement-items/schemas";
import { subMerchantIdsParam } from "@/features/sub-merchants/utils/sub-merchant-ids";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import { paginationQuerySchema } from "@/lib/schemas/pagination";
import { requirePermission } from "@/server/auth/require-permission";
import { readSettlementList } from "@/server/modules/settlement-items/settlement-list";

const rawQuerySchema = paginationQuerySchema.extend({
  subMerchantIds: subMerchantIdsParam,
  terminalId: settlementFilterSchema.shape.terminalId,
  trancheStatus: settlementFilterSchema.shape.trancheStatus,
  paidFrom: settlementFilterSchema.shape.paidFrom,
  paidTo: settlementFilterSchema.shape.paidTo,
});

/** The range is required and checked here first; Sub, Terminal and tranche group are optional (mục 11). */
export async function GET(request: Request) {
  const access = await requirePermission("VIEW_BALANCE");
  if (!access.ok) return access.response;
  const raw = rawQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  const query = raw.success ? settlementFilterSchema.safeParse(raw.data) : raw;
  if (!query.success) {
    return NextResponse.json({ message: query.error.issues[0]?.message ?? "Tham số không hợp lệ" }, { status: 400 });
  }
  const result = await readSettlementList(query.data);
  if (!result.success) {
    return NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
  }
  return NextResponse.json(result.data);
}
