import { invalidIdResponse } from "@/lib/be/route-id";
import { NextResponse } from "next/server";
import { getResetPasswordBlock } from "@/features/users/utils/user-restrictions";
import { resetUserPassword } from "@/server/modules/users/user.service";
import { requireOwnedUser, requireUserAccess, serviceResponse } from "@/server/modules/users/require-user-access";

type Context = { params: Promise<{ id: string }> };

/** No request body: the BE queues the reset for an active user other than the caller. */
export async function POST(_request: Request, context: Context) {
  const access = await requireUserAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const user = await requireOwnedUser(id, access.user);
  if (user instanceof NextResponse) return user;
  const blocked = getResetPasswordBlock(user, access.user.userId);
  if (blocked) return NextResponse.json({ message: blocked }, { status: 403 });
  return serviceResponse(await resetUserPassword(id));
}
