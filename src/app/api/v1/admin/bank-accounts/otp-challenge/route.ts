import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { bankChallengeBodySchema } from "@/features/bank-accounts/schemas/bank-account-request.schema";
import { requestSensitiveOtp } from "@/server/modules/bank-accounts/bank-account.service";
import {
  badRequest,
  bankErrorResponse,
  requireBankAccountAccess,
  requireOwnedBankAccount,
} from "@/server/modules/bank-accounts/require-bank-account-access";

/** The operation is fixed here: the approval operation must never be requestable from the portal. */
export async function POST(request: Request) {
  const access = await requireBankAccountAccess("write");
  if (!access.ok) return access.response;
  const body = bankChallengeBodySchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return badRequest();
  const { targetId } = body.data;
  if (targetId) {
    const invalidId = invalidIdResponse(targetId);
    if (invalidId) return invalidId;
    const account = await requireOwnedBankAccount(targetId, access.user);
    if (account instanceof NextResponse) return account;
  }
  const result = await requestSensitiveOtp("BANK_ACCOUNT_CHANGE", targetId);
  return result.success ? NextResponse.json(result.data) : bankErrorResponse(result.error);
}
