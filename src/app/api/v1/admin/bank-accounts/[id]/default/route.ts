import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { bankReasonBodySchema } from "@/features/bank-accounts/schemas/bank-account-request.schema";
import { setDefaultBankAccount } from "@/server/modules/bank-accounts/bank-account.service";
import {
  badRequest,
  bankErrorResponse,
  requireBankAccountAccess,
  requireOwnedBankAccount,
} from "@/server/modules/bank-accounts/require-bank-account-access";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const access = await requireBankAccountAccess("write");
  if (!access.ok) return access.response;
  const body = bankReasonBodySchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return badRequest(body.error.issues[0]?.message);
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const account = await requireOwnedBankAccount(id, access.user);
  if (account instanceof NextResponse) return account;
  const result = await setDefaultBankAccount(id, body.data.reason);
  return result.success ? NextResponse.json(result.data) : bankErrorResponse(result.error);
}
