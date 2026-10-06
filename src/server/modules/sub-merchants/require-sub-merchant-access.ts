import "server-only";

import { NextResponse } from "next/server";
import { requirePermission, type PermissionAccess } from "@/server/auth/require-permission";
import type { SessionUser } from "@/types/auth";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import type { BeResult } from "@/lib/be/client";
import type { SubMerchantDetail } from "@/features/sub-merchants/types";
import { getSubMerchant } from "./sub-merchant.service";

function reject(message: string, status: number): NextResponse {
  return NextResponse.json({ message }, { status });
}

export function requireSubMerchantAccess(): Promise<PermissionAccess> {
  return requirePermission("MANAGE_SUB_MERCHANT");
}

export function selectMerchantId(user: SessionUser, requested?: string | null): string | NextResponse {
  const id = requested || user.merchantIds[0];
  if (!id || !user.merchantIds.includes(id)) return reject("Không có quyền truy cập", 403);
  return id;
}

export async function requireOwnedSubMerchant(
  id: string,
  user: SessionUser,
): Promise<SubMerchantDetail | NextResponse> {
  const result: BeResult<SubMerchantDetail> = await getSubMerchant(id);
  if (!result.success) {
    return reject(domainErrorMessage(result.error), toDomainHttpStatus(result.error));
  }
  if (!user.merchantIds.includes(result.data.merchantId)) {
    return reject("Không tìm thấy điểm bán", 404);
  }
  return result.data;
}
