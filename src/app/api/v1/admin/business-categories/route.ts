import { NextResponse } from "next/server";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import { requirePermission } from "@/server/auth/require-permission";
import { listBusinessCategories } from "@/server/modules/business-categories/business-category.service";

/**
 * Danh mục ngành nghề MCC cho dropdown ở hồ sơ ĐVCNTT và form Sub-merchant. BE chỉ đòi đăng nhập Portal, nên route
 * này cũng không đòi quyền riêng (người dùng nào mở được hai form đó đều cần danh sách).
 */
export async function GET() {
  const access = await requirePermission();
  if (!access.ok) return access.response;
  const result = await listBusinessCategories();
  return result.success
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
