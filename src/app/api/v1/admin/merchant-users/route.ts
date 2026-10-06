import { NextResponse } from "next/server";
import { paginationQuerySchema } from "@/lib/schemas/pagination";
import { z } from "zod";
import { userFormSchema, merchantUserStatusSchema } from "@/features/users/schemas/user.schema";
import { createUser, listUsers } from "@/server/modules/users/user.service";
import { requireGroupScope, requireMerchantScope, requireSubMerchantScope, requireUserAccess, serviceResponse } from "@/server/modules/users/require-user-access";

const querySchema = paginationQuerySchema.extend({
  query: z.string().max(100).optional(),
  status: merchantUserStatusSchema.optional(),
});

export async function GET(request: Request) {
  const access = await requireUserAccess();
  if (!access.ok) return access.response;
  const params = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse(Object.fromEntries(params));
  if (!parsed.success) return NextResponse.json({ message: "Tham số không hợp lệ" }, { status: 400 });
  const merchantId = params.get("merchantId") || access.user.merchantIds[0];
  if (!merchantId) return NextResponse.json({ message: "Không có merchant" }, { status: 403 });
  const forbidden = requireMerchantScope(access.user, [merchantId]);
  if (forbidden) return forbidden;
  return serviceResponse(await listUsers({ merchantId, ...parsed.data }));
}

export async function POST(request: Request) {
  const access = await requireUserAccess();
  if (!access.ok) return access.response;
  const body = userFormSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  const merchantId = body.data.merchantIds[0] || access.user.merchantIds[0];
  if (!merchantId) return NextResponse.json({ message: "Không có merchant" }, { status: 403 });
  const forbidden = requireMerchantScope(access.user, body.data.merchantIds) || requireSubMerchantScope(access.user, body.data.subMerchantIds) || await requireGroupScope(access.user, body.data.groupIds);
  if (forbidden) return forbidden;
  return serviceResponse(await createUser(body.data, merchantId), 201);
}
