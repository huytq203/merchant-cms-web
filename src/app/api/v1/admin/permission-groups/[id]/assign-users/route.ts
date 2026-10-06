import { NextResponse } from "next/server";
import { z } from "zod";
import { invalidIdResponse } from "@/lib/be/route-id";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import { assignGroupUsers } from "@/server/modules/permissions/permission.service";
import {
  requireOwnedPermissionGroup,
  requirePermissionGroupAccess,
} from "@/server/modules/permissions/require-permission-group-access";

type Context = { params: Promise<{ id: string }> };
const userIdsSchema = z.array(z.uuid());

export async function POST(request: Request, context: Context) {
  const access = await requirePermissionGroupAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const body = userIdsSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: "Dữ liệu không hợp lệ" }, { status: 400 });
  const group = await requireOwnedPermissionGroup(id, access.user);
  if (group instanceof NextResponse) return group;
  if (group.system || group.merchantId === null) {
    return NextResponse.json({ message: "Không thể gán người dùng cho nhóm hệ thống" }, { status: 403 });
  }
  const result = await assignGroupUsers(id, body.data);
  return result.success
    ? new Response(null, { status: 204 })
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
