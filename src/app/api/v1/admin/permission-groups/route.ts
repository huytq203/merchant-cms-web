import { NextResponse } from "next/server";
import { paginationQuerySchema } from "@/lib/schemas/pagination";
import { z } from "zod";
import { permissionGroupFormSchema } from "@/features/permission/schemas/permission-group.schema";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import { createPermissionGroup, listPermissionGroups } from "@/server/modules/permissions/permission.service";
import { requirePermissionGroupAccess, selectPermissionGroupMerchant } from "@/server/modules/permissions/require-permission-group-access";

const listQuerySchema = paginationQuerySchema.extend({
  query: z.string().max(100).optional(),
  keyword: z.string().max(100).optional(),
  systemOnly: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
});

export async function GET(request: Request) {
  const access = await requirePermissionGroupAccess();
  if (!access.ok) return access.response;
  const params = new URL(request.url).searchParams;
  const merchantId = selectPermissionGroupMerchant(access.user, params.get("merchantId"));
  if (merchantId instanceof NextResponse) return merchantId;
  const parsed = listQuerySchema.safeParse(Object.fromEntries(params));
  if (!parsed.success) return NextResponse.json({ message: "Tham số không hợp lệ" }, { status: 400 });
  const { keyword, ...filter } = parsed.data;
  const result = await listPermissionGroups({
    merchantId,
    ...filter,
    ...(keyword ? { query: keyword } : {}),
  });
  return result.success
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}

export async function POST(request: Request) {
  const access = await requirePermissionGroupAccess();
  if (!access.ok) return access.response;
  const raw: unknown = await request.json().catch(() => null);
  const body = permissionGroupFormSchema.safeParse(raw);
  if (!body.success) return NextResponse.json({ message: body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  const requested = typeof raw === "object" && raw !== null && "merchantId" in raw && typeof raw.merchantId === "string" ? raw.merchantId : null;
  const merchantId = selectPermissionGroupMerchant(access.user, requested);
  if (merchantId instanceof NextResponse) return merchantId;
  const result = await createPermissionGroup(body.data, merchantId);
  return result.success
    ? NextResponse.json(result.data, { status: 201 })
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
