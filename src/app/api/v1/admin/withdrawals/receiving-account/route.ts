import { NextResponse } from "next/server";
import { z } from "zod";
import { toReceivingAccount } from "@/features/withdrawals/utils/withdrawal-mapper";
import { listBankAccounts } from "@/server/modules/bank-accounts/bank-account.service";
import {
  beErrorResponse,
  requireSubMerchantScope,
  requireWithdrawalAccess,
  resolveMerchantId,
} from "@/server/modules/withdrawals/require-withdrawal-access";

const querySchema = z.object({ subMerchantId: z.uuid() });

/**
 * TK nhận tiền của một Sub (SRS v2, 18/11/2026): mỗi Sub đúng 1 TK nên form rút chỉ HIỂN THỊ TK đang gán, không chọn.
 * Không lọc theo trạng thái: TK Chờ xác minh vẫn rút được, TK Khóa vẫn trả về để màn hình nói rõ (BE từ chối bằng 5738).
 * `account: null` = Sub chưa gán TK (BE từ chối bằng 5736). Số TK đã che ở BE, chuyển nguyên.
 */
export async function GET(request: Request) {
  const access = await requireWithdrawalAccess("CREATE_WITHDRAWAL");
  if (!access.ok) return access.response;
  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return NextResponse.json({ message: "Tham số không hợp lệ" }, { status: 400 });
  const merchantId = resolveMerchantId(access.user);
  if (merchantId instanceof NextResponse) return merchantId;
  const { subMerchantId } = query.data;
  const denied = requireSubMerchantScope(access.user, subMerchantId);
  if (denied) return denied;
  const result = await listBankAccounts({ page: 1, pageSize: 10, merchantId, subMerchantIds: [subMerchantId] });
  if (!result.success) return beErrorResponse(result.error);
  // Kiểm lại phía BFF: chỉ nhận TK của Master phiên và đang gán đúng Sub này.
  const assigned = result.data.rows.find(
    (account) => account.merchantId === merchantId && account.assignedSubMerchants.some((sub) => sub.id === subMerchantId),
  );
  return NextResponse.json({ account: assigned ? toReceivingAccount(assigned) : null });
}
