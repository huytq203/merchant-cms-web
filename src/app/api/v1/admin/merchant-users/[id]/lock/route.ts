import { invalidIdResponse } from "@/lib/be/route-id";
import { NextResponse } from "next/server";
import { REASON_LENGTH_MESSAGE, reasonBodySchema } from "@/lib/schemas/reason";
import { canLockUser } from "@/features/users/utils/user-mapper";
import { lockUser } from "@/server/modules/users/user.service";
import { requireOwnedUser, requireUserAccess, serviceResponse } from "@/server/modules/users/require-user-access";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const access = await requireUserAccess();
  if (!access.ok) return access.response;
  const body = reasonBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: REASON_LENGTH_MESSAGE }, { status: 400 });
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const user = await requireOwnedUser(id, access.user);
  if (user instanceof NextResponse) return user;
  if (!canLockUser(user, access.user.userId)) return NextResponse.json({ message: "Không thể khoá người dùng" }, { status: 403 });
  return serviceResponse(await lockUser(id, body.data.reason));
}
