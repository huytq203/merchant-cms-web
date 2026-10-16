import "server-only";

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { hasAnyPermission, type MerchantPermission } from "@/features/auth/permissions";
import type { SessionUser } from "@/types/auth";

export type PermissionAccess =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

export interface RequirePermissionOptions {
  /** Từ chối 403 khi session không thuộc merchant nào. */
  requireMerchant?: boolean;
}

function reject(message: string, status: number): PermissionAccess {
  return { ok: false, response: NextResponse.json({ message }, { status }) };
}

/**
 * Guard dùng chung cho route handler: 401 khi chưa đăng nhập,
 * 403 khi thiếu quyền (một mã hoặc any-of một danh sách; bỏ `permission` nếu chỉ cần session) hoặc khi thiếu merchant (nếu yêu cầu).
 */
export async function requirePermission(
  permission?: MerchantPermission | readonly MerchantPermission[],
  options: RequirePermissionOptions = {},
): Promise<PermissionAccess> {
  const user = await getServerSession();
  if (!user) return reject("Vui lòng đăng nhập", 401);
  const permitted = !permission || hasAnyPermission(user.permissions, typeof permission === "string" ? [permission] : permission);
  const hasMerchant = !options.requireMerchant || user.merchantIds.length > 0;
  if (!permitted || !hasMerchant) return reject("Không có quyền truy cập", 403);
  return { ok: true, user };
}
