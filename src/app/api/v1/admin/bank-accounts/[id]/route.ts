import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { bankReasonBodySchema, updateBankBodySchema } from "@/features/bank-accounts/schemas/bank-account-request.schema";
import { isBankIdentityChanged } from "@/features/bank-accounts/utils/bank-mapper";
import { deleteBankAccount, updateBankAccount } from "@/server/modules/bank-accounts/bank-account.service";
import {
  badRequest,
  bankErrorResponse,
  requireBankAccountAccess,
  requireOwnedBankAccount,
} from "@/server/modules/bank-accounts/require-bank-account-access";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const access = await requireBankAccountAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const account = await requireOwnedBankAccount(id, access.user);
  return account instanceof NextResponse ? account : NextResponse.json(account);
}

export async function PUT(request: Request, context: Context) {
  const access = await requireBankAccountAccess();
  if (!access.ok) return access.response;
  const body = updateBankBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest(body.error.issues[0]?.message);
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const account = await requireOwnedBankAccount(id, access.user);
  if (account instanceof NextResponse) return account;
  const changed = isBankIdentityChanged(account, {
    bankCode: body.data.bankCode ?? account.bankCode,
    accountNumber: body.data.accountNumber ?? account.accountNumber,
    accountName: body.data.accountName ?? account.accountName,
  });
  if (changed && !body.data.otp) return badRequest("Cần mã OTP để thay đổi thông tin tài khoản");
  const result = await updateBankAccount(id, body.data);
  return result.success ? NextResponse.json(result.data) : bankErrorResponse(result.error);
}

export async function DELETE(request: Request, context: Context) {
  const access = await requireBankAccountAccess();
  if (!access.ok) return access.response;
  const body = bankReasonBodySchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return badRequest(body.error.issues[0]?.message);
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const account = await requireOwnedBankAccount(id, access.user);
  if (account instanceof NextResponse) return account;
  const result = await deleteBankAccount(id, body.data.reason);
  return result.success ? new NextResponse(null, { status: 204 }) : bankErrorResponse(result.error);
}
