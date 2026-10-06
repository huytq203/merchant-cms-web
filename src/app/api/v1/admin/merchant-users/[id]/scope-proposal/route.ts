import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { getScopeProposal } from "@/server/modules/users/user.service";
import { requireOwnedUser, requireUserAccess, serviceResponse } from "@/server/modules/users/require-user-access";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const access = await requireUserAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const user = await requireOwnedUser(id, access.user);
  if (user instanceof NextResponse) return user;
  return serviceResponse(await getScopeProposal(id));
}
