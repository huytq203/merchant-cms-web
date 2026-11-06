import { NextResponse } from "next/server";
import { withdrawalOtpChallengeBodySchema } from "@/features/withdrawals/schemas/withdrawal.schema";
import { requestWithdrawalOtp } from "@/server/modules/withdrawals/withdrawal.service";
import { beErrorResponse, requireWithdrawalAccess } from "@/server/modules/withdrawals/require-withdrawal-access";

/** The operation is fixed in the service; the browser only names the account and amount the code is tied to. */
export async function POST(request: Request) {
  const access = await requireWithdrawalAccess("CREATE_WITHDRAWAL");
  if (!access.ok) return access.response;
  const body = withdrawalOtpChallengeBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ message: body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  }
  const result = await requestWithdrawalOtp(body.data);
  return result.success ? NextResponse.json(result.data) : beErrorResponse(result.error);
}
