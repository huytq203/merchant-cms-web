import { NextResponse } from "next/server";
import { z } from "zod";
import { getWithdrawalBalance } from "@/server/modules/withdrawals/withdrawal.service";
import {
  beErrorResponse,
  requireSubMerchantScope,
  requireWithdrawalAccess,
} from "@/server/modules/withdrawals/require-withdrawal-access";

// bankAccountId (11/11): TK nhận đang chọn, để BE tính phí theo ngân hàng của TK đó. BE kiểm TK thuộc Sub/phiên.
const querySchema = z.object({ subMerchantId: z.uuid(), bankAccountId: z.uuid().optional() });

/** What one Sub can withdraw now. BE derives the Master from the Sub; the Sub must be in the session scope. */
export async function GET(request: Request) {
  const access = await requireWithdrawalAccess("VIEW_WITHDRAWAL");
  if (!access.ok) return access.response;
  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return NextResponse.json({ message: "Tham số không hợp lệ" }, { status: 400 });
  const denied = requireSubMerchantScope(access.user, query.data.subMerchantId);
  if (denied) return denied;
  const { subMerchantId, bankAccountId } = query.data;
  const result = bankAccountId ? await getWithdrawalBalance(subMerchantId, bankAccountId) : await getWithdrawalBalance(subMerchantId);
  return result.success ? NextResponse.json(result.data) : beErrorResponse(result.error);
}
