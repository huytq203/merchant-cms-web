import { invalidIdResponse } from "@/lib/be/route-id";
import { NextResponse } from "next/server";
import { z } from "zod";
import { userFullNameSchema, userPhoneSchema } from "@/features/users/schemas/user.schema";
import { updateUser } from "@/server/modules/users/user.service";
import { requireOwnedUser, requireUserAccess, serviceResponse } from "@/server/modules/users/require-user-access";

type Context = { params: Promise<{ id: string }> };
const updateSchema = z.object({
  // Cùng luật họ tên/SĐT với form tạo (C-U2); BE cũng kiểm lại.
  fullName: userFullNameSchema,
  phone: userPhoneSchema,
});

export async function GET(_request: Request, context: Context) {
  const access = await requireUserAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const user = await requireOwnedUser(id, access.user);
  return user instanceof NextResponse ? user : NextResponse.json(user);
}

export async function PUT(request: Request, context: Context) {
  const access = await requireUserAccess();
  if (!access.ok) return access.response;
  const body = updateSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: "Dữ liệu không hợp lệ" }, { status: 400 });
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const user = await requireOwnedUser(id, access.user);
  if (user instanceof NextResponse) return user;
  return serviceResponse(await updateUser(id, body.data));
}
