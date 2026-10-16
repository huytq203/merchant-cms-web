import { NextResponse } from "next/server";
import { bankListQuerySchema, createBankBodySchema } from "@/features/bank-accounts/schemas/bank-account-request.schema";
import { createBankAccount, listBankAccounts } from "@/server/modules/bank-accounts/bank-account.service";
import {
  badRequest,
  bankErrorResponse,
  checkSubMerchantScope,
  requireBankAccountAccess,
  selectMerchantId,
} from "@/server/modules/bank-accounts/require-bank-account-access";

export async function GET(request: Request) {
  const access = await requireBankAccountAccess("read");
  if (!access.ok) return access.response;
  const query = bankListQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return badRequest("Tham số không hợp lệ");
  const merchantId = selectMerchantId(access.user, query.data.merchantId);
  if (merchantId instanceof NextResponse) return merchantId;
  const outOfScope = checkSubMerchantScope(access.user, query.data.subMerchantId);
  if (outOfScope) return outOfScope;
  const result = await listBankAccounts({ ...query.data, merchantId });
  return result.success ? NextResponse.json(result.data) : bankErrorResponse(result.error);
}

export async function POST(request: Request) {
  const access = await requireBankAccountAccess("write");
  if (!access.ok) return access.response;
  const body = createBankBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest(body.error.issues[0]?.message);
  const merchantId = selectMerchantId(access.user, body.data.merchantId);
  if (merchantId instanceof NextResponse) return merchantId;
  const outOfScope = checkSubMerchantScope(access.user, body.data.subMerchantId);
  if (outOfScope) return outOfScope;
  const result = await createBankAccount({ ...body.data, merchantId });
  return result.success ? NextResponse.json(result.data, { status: 201 }) : bankErrorResponse(result.error);
}
