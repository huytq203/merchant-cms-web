import { NextResponse } from "next/server";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import { listPermissionCatalog } from "@/server/modules/permissions/permission.service";
import { requirePermissionGroupAccess } from "@/server/modules/permissions/require-permission-group-access";

export async function GET() {
  const access = await requirePermissionGroupAccess();
  if (!access.ok) return access.response;
  const result = await listPermissionCatalog();
  return result.success
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
