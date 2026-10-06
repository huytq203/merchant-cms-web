import "server-only";

import { NextResponse } from "next/server";
import type { MerchantPermission } from "@/features/auth/permissions";
import { requirePermission, type PermissionAccess } from "@/server/auth/require-permission";
import { domainErrorMessage, toDomainHttpStatus, type BeError } from "@/lib/be/errors";
import type { SessionUser } from "@/types/auth";
import type { BankAccount } from "@/features/bank-accounts/types";
import { getBankAccount } from "./bank-account.service";

/** Temporary: the FE permission list has no bank-account permission yet. */
export const BANK_ACCOUNT_PERMISSION: MerchantPermission = "MANAGE_SUB_MERCHANT";

const json = (message: string, status: number, code?: string) =>
  NextResponse.json(code ? { message, code } : { message }, { status });

/**
 * BE failures keep their status and error code (the UI tells a wrong OTP from a stale version).
 * A BE 401 comes from the realm chain, not from an expired session, so it must not log the user out.
 */
export function bankErrorResponse(error: BeError): NextResponse {
  return json(domainErrorMessage(error), toDomainHttpStatus(error), error.code);
}

export function requireBankAccountAccess(): Promise<PermissionAccess> {
  return requirePermission(BANK_ACCOUNT_PERMISSION, { requireMerchant: true });
}

/** The Master is always taken from the session; a requested one must belong to it. */
export function selectMerchantId(user: SessionUser, requested: string | undefined): string | NextResponse {
  if (requested && !user.merchantIds.includes(requested)) return json("Không có quyền truy cập", 403);
  return requested ?? user.merchantIds[0] ?? "";
}

export function checkSubMerchantScope(user: SessionUser, subMerchantId: string | undefined): NextResponse | null {
  return subMerchantId && !user.subMerchantIds.includes(subMerchantId) ? json("Không có quyền truy cập", 403) : null;
}

export async function requireOwnedBankAccount(id: string, user: SessionUser): Promise<BankAccount | NextResponse> {
  const result = await getBankAccount(id);
  if (!result.success) return bankErrorResponse(result.error);
  if (!user.merchantIds.includes(result.data.merchantId)) {
    return json("Không tìm thấy tài khoản ngân hàng", 404);
  }
  return result.data;
}

export const badRequest = (message?: string): NextResponse => json(message ?? "Dữ liệu không hợp lệ", 400);
