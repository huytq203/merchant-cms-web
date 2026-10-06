import { invalidIdResponse } from "@/lib/be/route-id";
import { NextResponse } from "next/server";
import { permissionGroupFormSchema } from "@/features/permission/schemas/permission-group.schema";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import { deletePermissionGroup, updatePermissionGroup } from "@/server/modules/permissions/permission.service";
import { requireOwnedPermissionGroup, requirePermissionGroupAccess } from "@/server/modules/permissions/require-permission-group-access";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const access = await requirePermissionGroupAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const detail = await requireOwnedPermissionGroup(id, access.user);
  return detail instanceof NextResponse ? detail : NextResponse.json(detail);
}

export async function PUT(request: Request, context: Context) {
  const access = await requirePermissionGroupAccess();
  if (!access.ok) return access.response;
  const body = permissionGroupFormSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const detail = await requireOwnedPermissionGroup(id, access.user);
  if (detail instanceof NextResponse) return detail;
  if (detail.system) return NextResponse.json({ message: "Không thể sửa nhóm hệ thống" }, { status: 403 });
  const result = await updatePermissionGroup(id, body.data);
  return result.success
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}

export async function DELETE(_request: Request, context: Context) {
  const access = await requirePermissionGroupAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const detail = await requireOwnedPermissionGroup(id, access.user);
  if (detail instanceof NextResponse) return detail;
  if (detail.system) return NextResponse.json({ message: "Không thể xoá nhóm hệ thống" }, { status: 403 });
  const result = await deletePermissionGroup(id);
  return result.success
    ? new Response(null, { status: 204 })
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
