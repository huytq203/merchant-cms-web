import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import { scopeProposalFormSchema } from "@/features/users/schemas/user.schema";
import { createScopeProposal } from "@/server/modules/users/user.service";
import {
  requireOwnedUser,
  requireSubMerchantScope,
  requireUserAccess,
  serviceResponse,
} from "@/server/modules/users/require-user-access";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const access = await requireUserAccess();
  if (!access.ok) return access.response;
  const body = scopeProposalFormSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ message: body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  }
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const user = await requireOwnedUser(id, access.user);
  if (user instanceof NextResponse) return user;
  const forbidden = requireSubMerchantScope(access.user, body.data.subMerchantIds);
  if (forbidden) return forbidden;
  return serviceResponse(await createScopeProposal(id, body.data), 201);
}
