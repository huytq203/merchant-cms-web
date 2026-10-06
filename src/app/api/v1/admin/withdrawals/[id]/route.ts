import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/be/route-id";
import {
  requireOwnedWithdrawal,
  requireWithdrawalAccess,
} from "@/server/modules/withdrawals/require-withdrawal-access";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const access = await requireWithdrawalAccess("VIEW_WITHDRAWAL");
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  const withdrawal = await requireOwnedWithdrawal(id, access.user);
  return withdrawal instanceof NextResponse ? withdrawal : NextResponse.json(withdrawal);
}
