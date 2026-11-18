import "server-only";

import { NextResponse } from "next/server";
import { PERMISSION_GATES } from "@/features/auth/permission-gates";
import { requirePermission, type PermissionAccess } from "@/server/auth/require-permission";
import { domainErrorMessage, toDomainHttpStatus, type BeError } from "@/lib/be/errors";
import type { SessionUser } from "@/types/auth";
import type { BankAccount } from "@/features/bank-accounts/types";
import { getBankAccount } from "./bank-account.service";

const json = (message: string, status: number, code?: string) =>
  NextResponse.json(code ? { message, code } : { message }, { status });

/**
 * BE failures keep their status and error code (the UI tells a wrong OTP from a stale version).
 * A BE 401 comes from the realm chain, not from an expired session, so it must not log the user out.
 */
export function bankErrorResponse(error: BeError): NextResponse {
  return json(domainErrorMessage(error), toDomainHttpStatus(error), error.code);
}

/**
 * Đọc: user chỉ được gán Sub (không có Master trong phiên) vẫn xem được TK đang gán cho Sub của mình — BE tự giới hạn
 * phạm vi (thiết kế TK NH v2 §6). Ghi: chỉ người có quyền toàn Master (BE cũng chặn), nên vẫn đòi Master trong phiên.
 */
export async function requireBankAccountAccess(mode: "read" | "write"): Promise<PermissionAccess> {
  if (mode === "write") return requirePermission(PERMISSION_GATES.bankAccountWrite, { requireMerchant: true });
  const access = await requirePermission(PERMISSION_GATES.bankAccountRead);
  if (access.ok && access.user.merchantIds.length === 0 && access.user.subMerchantIds.length === 0) {
    return { ok: false, response: json("Không có quyền truy cập", 403) };
  }
  return access;
}

/** The Master is always taken from the session; a requested one must belong to it. */
export function selectMerchantId(user: SessionUser, requested: string | undefined): string | NextResponse {
  if (requested && !user.merchantIds.includes(requested)) return json("Không có quyền truy cập", 403);
  return requested ?? user.merchantIds[0] ?? "";
}

export async function requireOwnedBankAccount(id: string, user: SessionUser): Promise<BankAccount | NextResponse> {
  const result = await getBankAccount(id);
  if (!result.success) return bankErrorResponse(result.error);
  // User chỉ được gán Sub: chỉ thấy TK đang gán cho Sub của mình (BE cũng giới hạn như vậy).
  const ownsMaster = user.merchantIds.includes(result.data.merchantId);
  const usedByOwnSub = (result.data.assignedSubMerchants ?? []).some((sub) => user.subMerchantIds.includes(sub.id));
  if (!ownsMaster && !usedByOwnSub) {
    return json("Không tìm thấy tài khoản ngân hàng", 404);
  }
  return result.data;
}

export const badRequest = (message?: string): NextResponse => json(message ?? "Dữ liệu không hợp lệ", 400);
