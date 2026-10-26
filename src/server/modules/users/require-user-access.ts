import "server-only";

import { NextResponse } from "next/server";
import { PERMISSION_GATES } from "@/features/auth/permission-gates";
import { requirePermission, type PermissionAccess } from "@/server/auth/require-permission";
import { API_MESSAGE_HEADER } from "@/lib/http/api-message";
import { merchantDomainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import type { SessionUser } from "@/types/auth";
import type { MerchantUser } from "@/features/users/schemas/user.schema";
import { getUser, listAssignableGroups } from "./user.service";

export function requireUserAccess(action: "manage" | "approveScope" = "manage"): Promise<PermissionAccess> {
  return requirePermission(action === "approveScope" ? PERMISSION_GATES.userScopeApprove : "MANAGE_USER");
}

export function requireMerchantScope(user: SessionUser, ids: string[]): NextResponse | null {
  return ids.every((id) => user.merchantIds.includes(id)) ? null : NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
}

export function requireSubMerchantScope(user: SessionUser, ids: string[]): NextResponse | null {
  return ids.every((id) => user.subMerchantIds.includes(id)) ? null : NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
}

/**
 * Every id must be in the list the BE says this caller may assign. That list needs only MANAGE_USER, unlike
 * GET /permission-groups, so a user manager without MANAGE_PERMISSION_GROUP (a Sub-level manager) can still assign groups.
 */
export async function requireGroupScope(ids: string[]): Promise<NextResponse | null> {
  if (ids.length === 0) return null;
  const result = await listAssignableGroups();
  if (!result.success) return NextResponse.json({ message: merchantDomainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
  const allowed = new Set(result.data.map((group) => group.id));
  return ids.every((id) => allowed.has(id)) ? null : NextResponse.json({ message: "Không có quyền truy cập nhóm quyền" }, { status: 403 });
}

export async function requireOwnedUser(id: string, actor: SessionUser): Promise<MerchantUser | NextResponse> {
  const result = await getUser(id);
  if (!result.success) return NextResponse.json({ message: merchantDomainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
  const userMerchantIds = result.data.merchantIds;
  const insideActorScope = userMerchantIds.length > 0 && userMerchantIds.every((merchantId) => actor.merchantIds.includes(merchantId));
  if (!insideActorScope) {
    return NextResponse.json({ message: "Không tìm thấy người dùng" }, { status: 404 });
  }
  return result.data;
}


/** The BE text is Vietnamese or English, so it travels URI-encoded to stay a legal header value. */
function messageHeaders(message?: string): HeadersInit | undefined {
  return message ? { [API_MESSAGE_HEADER]: encodeURIComponent(message) } : undefined;
}

export function serviceResponse<T>(result: { success: true; data: T; message?: string } | { success: false; error: { message: string; status: number; code: string } }, status = 200): NextResponse {
  return result.success ? NextResponse.json(result.data, { status, headers: messageHeaders(result.message) }) : NextResponse.json({ message: merchantDomainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
