import { NextResponse } from "next/server";
import { z } from "zod";
import { isMasterAccount, isWithdrawableAccount, toBankOption } from "@/features/withdrawals/utils/withdrawal-mapper";
import { listBankAccounts } from "@/server/modules/bank-accounts/bank-account.service";
import {
  beErrorResponse,
  requireSubMerchantScope,
  requireWithdrawalAccess,
  resolveMerchantId,
} from "@/server/modules/withdrawals/require-withdrawal-access";

const querySchema = z.object({ subMerchantId: z.uuid().optional() });

/** Master level bank accounts a withdrawal may pay out to (BE refuses lower levels). The number is already masked by the BE and is passed through as is. */
export async function GET(request: Request) {
  const access = await requireWithdrawalAccess("CREATE_WITHDRAWAL");
  if (!access.ok) return access.response;
  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return NextResponse.json({ message: "Tham số không hợp lệ" }, { status: 400 });
  const merchantId = resolveMerchantId(access.user);
  if (merchantId instanceof NextResponse) return merchantId;
  const denied = requireSubMerchantScope(access.user, query.data.subMerchantId);
  if (denied) return denied;
  const result = await listBankAccounts({
    page: 1,
    pageSize: 100,
    merchantId,
    linkStatus: "LINKED",
    ...(query.data.subMerchantId ? { subMerchantId: query.data.subMerchantId } : {}),
  });
  if (!result.success) return beErrorResponse(result.error);
  const withdrawable = result.data.rows.filter(
    (account) => account.merchantId === merchantId && isWithdrawableAccount(account),
  );
  const masterAccounts = withdrawable.filter(isMasterAccount);
  return NextResponse.json({
    options: masterAccounts.map(toBankOption),
    hasHiddenSubMerchantAccounts: masterAccounts.length < withdrawable.length,
  });
}
