import "server-only";

import { NextResponse } from "next/server";
import type { MerchantPermission } from "@/features/auth/permissions";
import { requirePermission, type PermissionAccess } from "@/server/auth/require-permission";
import { domainErrorMessage, toDomainHttpStatus, type BeError } from "@/lib/be/errors";
import type { SessionUser } from "@/types/auth";
import type { Order } from "@/features/orders/schemas/order.schema";
import { getOrder } from "./order.service";

const forbidden = () => NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });

export function requireOrderAccess(permission: MerchantPermission): Promise<PermissionAccess> {
  return requirePermission(permission);
}

/** The merchant always comes from the session, never from the client. */
export function resolveMerchantId(user: SessionUser): string | NextResponse {
  const merchantId = user.merchantIds[0];
  if (!merchantId) return forbidden();
  return merchantId;
}

export function requireSubMerchantScope(user: SessionUser, subMerchantId?: string): NextResponse | null {
  if (subMerchantId && !user.subMerchantIds.includes(subMerchantId)) return forbidden();
  return null;
}

export function beErrorResponse(error: BeError): NextResponse {
  const message = domainErrorMessage(error);
  const body = error.fieldErrors ? { message, details: error.fieldErrors } : { message };
  return NextResponse.json(body, { status: toDomainHttpStatus(error) });
}

export async function requireOwnedOrder(id: string, user: SessionUser): Promise<Order | NextResponse> {
  const result = await getOrder(id);
  if (!result.success) return beErrorResponse(result.error);
  if (!user.merchantIds.includes(result.data.merchantId)) {
    return NextResponse.json({ message: "Không tìm thấy đơn hàng" }, { status: 404 });
  }
  return result.data;
}
