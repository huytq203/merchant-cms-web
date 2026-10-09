import { NextResponse } from "next/server";
import { requestWithdrawalOtp } from "@/server/modules/withdrawals/withdrawal.service";
import { beErrorResponse, requireWithdrawalAccess } from "@/server/modules/withdrawals/require-withdrawal-access";

/** The operation is fixed in the service: a browser cannot ask for any other kind of code through here. */
export async function POST() {
  const access = await requireWithdrawalAccess("CREATE_WITHDRAWAL");
  if (!access.ok) return access.response;
  const result = await requestWithdrawalOtp();
  return result.success ? NextResponse.json(result.data) : beErrorResponse(result.error);
}
