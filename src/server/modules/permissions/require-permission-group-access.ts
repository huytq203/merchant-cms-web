import "server-only";

import { NextResponse } from "next/server";
import { requirePermission, type PermissionAccess } from "@/server/auth/require-permission";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import type { SessionUser } from "@/types/auth";
import type { PermissionGroup } from "@/features/permission/schemas/permission-group.schema";
import { getPermissionGroup } from "./permission.service";

export function requirePermissionGroupAccess(): Promise<PermissionAccess> {
  return requirePermission("MANAGE_PERMISSION_GROUP");
}

export function selectPermissionGroupMerchant(user: SessionUser, requested?: string | null): string | NextResponse {
  const merchantId = requested || user.merchantIds[0];
  if (!merchantId || !user.merchantIds.includes(merchantId)) {
    return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
  }
  return merchantId;
}

export async function requireOwnedPermissionGroup(id: string, user: SessionUser): Promise<PermissionGroup | NextResponse> {
  const result = await getPermissionGroup(id);
  if (!result.success) {
    return NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
  }
  if (result.data.merchantId && !user.merchantIds.includes(result.data.merchantId)) {
    return NextResponse.json({ message: "Không tìm thấy nhóm quyền" }, { status: 404 });
  }
  return result.data;
}
