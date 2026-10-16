import "server-only";

import { NextResponse } from "next/server";
import { PERMISSION_GATES } from "@/features/auth/permission-gates";
import { requirePermission, type PermissionAccess } from "@/server/auth/require-permission";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import type { BeError } from "@/lib/be/errors";
import type { SessionUser } from "@/types/auth";
import { getMerchant } from "./kyb.service";

type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: BeError };

const NOT_FOUND_MESSAGE = "Không tìm thấy hồ sơ";

/** Reading a dossier needs no permission, only a session scoped to a merchant; ownership is checked per resource below. */
export function requireKybAccess(): Promise<PermissionAccess> {
  return requirePermission(undefined, { requireMerchant: true });
}

/** Changing, submitting or uploading for a dossier is MANAGE_SUB_MERCHANT on the BE. */
export function requireKybWriteAccess(): Promise<PermissionAccess> {
  return requirePermission(PERMISSION_GATES.subMerchantManage, { requireMerchant: true });
}

/** The shared sensitive-operation code is issued to whoever may change a dossier or a bank account. */
export function requireKybOtpAccess(): Promise<PermissionAccess> {
  return requirePermission(PERMISSION_GATES.sensitiveOtp, { requireMerchant: true });
}

function notFound() {
  return NextResponse.json({ message: NOT_FOUND_MESSAGE }, { status: 404 });
}

/** A merchant belongs to the caller only when its id is in the session scope. */
export function requireMerchantScope(user: SessionUser, merchantId: string): NextResponse | null {
  return user.merchantIds.includes(merchantId) ? null : notFound();
}

/**
 * A wallet belongs to the caller when one of the session merchants sits on it. The BE exposes no
 * "wallets of this merchant" lookup, so each session merchant is read until one matches.
 */
export async function requireOwnedWallet(walletId: string, user: SessionUser): Promise<NextResponse | null> {
  let failure: BeError | null = null;
  for (const merchantId of user.merchantIds) {
    const result = await getMerchant(merchantId);
    if (!result.success) {
      failure = result.error;
      continue;
    }
    if (result.data.enterpriseWalletId === walletId) return null;
  }
  if (failure) {
    return NextResponse.json({ message: domainErrorMessage(failure) }, { status: toDomainHttpStatus(failure) });
  }
  return notFound();
}

export function toRouteResponse<T>(result: ServiceResult<T>, status = 200): NextResponse {
  if (result.success) return NextResponse.json(result.data, { status });
  return NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}

