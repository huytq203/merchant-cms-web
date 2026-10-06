import { invalidIdResponse } from "@/lib/be/route-id";
import { NextResponse } from "next/server";
import { canUnlockUser } from "@/features/users/utils/user-mapper";
import { unlockUser } from "@/server/modules/users/user.service";
import { requireOwnedUser, requireUserAccess, serviceResponse } from "@/server/modules/users/require-user-access";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const access = await requireUserAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const user = await requireOwnedUser(id, access.user);
  if (user instanceof NextResponse) return user;
  if (!canUnlockUser(user)) return NextResponse.json({ message: "Không thể mở khoá người dùng" }, { status: 403 });
  return serviceResponse(await unlockUser(id));
}
