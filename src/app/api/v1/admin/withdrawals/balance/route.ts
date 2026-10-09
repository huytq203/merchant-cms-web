import { NextResponse } from "next/server";
import { getWithdrawalBalance } from "@/server/modules/withdrawals/withdrawal.service";
import {
  beErrorResponse,
  requireWithdrawalAccess,
  resolveMerchantId,
} from "@/server/modules/withdrawals/require-withdrawal-access";

/** What the merchant can withdraw now. The merchant comes from the session, never from the client. */
export async function GET() {
  const access = await requireWithdrawalAccess("VIEW_WITHDRAWAL");
  if (!access.ok) return access.response;
  const merchantId = resolveMerchantId(access.user);
  if (merchantId instanceof NextResponse) return merchantId;
  const result = await getWithdrawalBalance(merchantId);
  return result.success ? NextResponse.json(result.data) : beErrorResponse(result.error);
}
