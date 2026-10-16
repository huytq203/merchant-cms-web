import { NextResponse } from "next/server";
import { z } from "zod";
import { invalidIdResponse } from "@/lib/be/route-id";
import { rejectScopeProposal } from "@/server/modules/users/user.service";
import { requireOwnedUser, requireUserAccess, serviceResponse } from "@/server/modules/users/require-user-access";

type Context = { params: Promise<{ id: string }> };
const bodySchema = z.object({ reason: z.string().trim().min(1).max(500) });

export async function POST(request: Request, context: Context) {
  const access = await requireUserAccess("approveScope");
  if (!access.ok) return access.response;
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: "Cần nhập lý do từ chối" }, { status: 400 });
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const user = await requireOwnedUser(id, access.user);
  if (user instanceof NextResponse) return user;
  return serviceResponse(await rejectScopeProposal(id, body.data.reason));
}
