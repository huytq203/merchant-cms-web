import "server-only";

import { NextResponse } from "next/server";
import type { MerchantPermission } from "@/features/auth/permissions";
import { requirePermission, type PermissionAccess } from "@/server/auth/require-permission";
import { toDomainHttpStatus, type BeError } from "@/lib/be/errors";
import type { SessionUser } from "@/types/auth";
import type { Withdrawal } from "@/features/withdrawals/schemas/withdrawal.schema";
import { getWithdrawal } from "./withdrawal.service";

const forbidden = () => NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });

export function requireWithdrawalAccess(permission: MerchantPermission): Promise<PermissionAccess> {
  return requirePermission(permission);
}

/** The merchant always comes from the session, never from the client. */
export function resolveMerchantId(user: SessionUser): string | NextResponse {
  const merchantId = user.merchantIds[0];
  if (!merchantId) return forbidden();
  return merchantId;
}

/** An empty `subMerchantIds` means no Sub restriction (BE still checks the scope), so only a limited session is refused here. */
export function requireSubMerchantScope(user: SessionUser, subMerchantId?: string): NextResponse | null {
  if (subMerchantId && user.subMerchantIds.length > 0 && !user.subMerchantIds.includes(subMerchantId)) return forbidden();
  return null;
}

/** A BE 401 here means the realm chain refused the call, not that the session expired, so it becomes 403. */
export function beErrorResponse(error: BeError): NextResponse {
  const body = error.fieldErrors ? { message: error.message, details: error.fieldErrors } : { message: error.message };
  return NextResponse.json({ ...body, code: error.code }, { status: toDomainHttpStatus(error) });
}

export async function requireOwnedWithdrawal(id: string, user: SessionUser): Promise<Withdrawal | NextResponse> {
  const result = await getWithdrawal(id);
  if (!result.success) return beErrorResponse(result.error);
  if (!user.merchantIds.includes(result.data.merchantId)) {
    return NextResponse.json({ message: "Không tìm thấy yêu cầu rút tiền" }, { status: 404 });
  }
  return result.data;
}
