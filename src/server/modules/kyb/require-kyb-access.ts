import "server-only";

import { NextResponse } from "next/server";
import { requirePermission, type PermissionAccess } from "@/server/auth/require-permission";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import type { BeError } from "@/lib/be/errors";
import type { SessionUser } from "@/types/auth";
import { getMerchant } from "./kyb.service";

type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: BeError };

const NOT_FOUND_MESSAGE = "Không tìm thấy hồ sơ";

/**
 * The BE has no KYB-specific permission in `MerchantPermission` yet, so the guard asks for a valid
 * session that is scoped to at least one merchant; ownership is checked per resource below.
 */
export function requireKybAccess(): Promise<PermissionAccess> {
  return requirePermission(undefined, { requireMerchant: true });
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

