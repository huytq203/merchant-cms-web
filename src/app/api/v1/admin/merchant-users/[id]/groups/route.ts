import { invalidIdResponse } from "@/lib/be/route-id";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assignUserGroups } from "@/server/modules/users/user.service";
import { requireGroupScope, requireOwnedUser, requireUserAccess, serviceResponse } from "@/server/modules/users/require-user-access";

type Context = { params: Promise<{ id: string }> };
const assignmentSchema = z.object({ ids: z.array(z.uuid()).min(1) });

export async function PUT(request: Request, context: Context) {
  const access = await requireUserAccess();
  if (!access.ok) return access.response;
  const body = assignmentSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: "Dữ liệu không hợp lệ" }, { status: 400 });
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const user = await requireOwnedUser(id, access.user);
  if (user instanceof NextResponse) return user;
  const forbidden = await requireGroupScope(access.user, body.data.ids);
  if (forbidden) return forbidden;
  return serviceResponse(await assignUserGroups(id, body.data.ids));
}
