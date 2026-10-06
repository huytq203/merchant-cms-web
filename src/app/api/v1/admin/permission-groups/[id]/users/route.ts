import { invalidIdResponse } from "@/lib/be/route-id";
import { NextResponse } from "next/server";
import { z } from "zod";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import { listGroupUsers } from "@/server/modules/permissions/permission.service";
import { requireOwnedPermissionGroup, requirePermissionGroupAccess } from "@/server/modules/permissions/require-permission-group-access";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const access = await requirePermissionGroupAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const detail = await requireOwnedPermissionGroup(id, access.user);
  if (detail instanceof NextResponse) return detail;
  const params = new URL(request.url).searchParams;
  const page = z.coerce.number().int().min(1).safeParse(params.get("page") ?? 1);
  if (!page.success) return NextResponse.json({ message: "Tham số không hợp lệ" }, { status: 400 });
  const result = await listGroupUsers(id, page.data);
  return result.success
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
