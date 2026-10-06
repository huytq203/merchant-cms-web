import { NextResponse } from "next/server";
import { walletDraftSchema } from "@/features/kyb/schemas/enterprise-wallet.schema";
import { invalidIdResponse } from "@/lib/be/route-id";
import { updateWallet } from "@/server/modules/kyb/kyb.service";
import {
  requireKybAccess,
  requireOwnedWallet,
  toRouteResponse,
} from "@/server/modules/kyb/require-kyb-access";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const access = await requireKybAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const body = walletDraftSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    const message = body.error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
    return NextResponse.json({ message }, { status: 400 });
  }
  const notOwned = await requireOwnedWallet(id, access.user);
  if (notOwned) return notOwned;
  return toRouteResponse(await updateWallet(id, body.data));
}
