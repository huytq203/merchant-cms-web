import { HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { hasAnyPermission } from "@/features/auth/permissions";
import { PERMISSION_GATES } from "@/features/auth/permission-gates";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { prefetchDehydrated, unwrapOrRedirect } from "@/lib/query/prefetch";
import { listBankAccounts } from "@/server/modules/bank-accounts/bank-account.service";
import { bankAccountQueries, parseBankAccountSearchParams } from "@/features/bank-accounts/bank-account-queries";
import { BankAccountsContainer } from "@/features/bank-accounts/components/BankAccountsContainer";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function BankAccountsPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  const merchantId = user.merchantIds[0];
  // User chỉ được gán Sub (không có Master) vẫn xem TK đang gán cho Sub của mình; BE tự giới hạn phạm vi.
  const hasScope = Boolean(merchantId) || user.subMerchantIds.length > 0;
  if (!hasAnyPermission(user.permissions, PERMISSION_GATES.bankAccountRead) || !hasScope) {
    return <AccessDenied />;
  }
  const filter = { ...parseBankAccountSearchParams(await searchParams), ...(merchantId ? { merchantId } : {}) };
  // Thêm/sửa/xóa TK chỉ dành cho người có quyền toàn Master (thiết kế TK NH v2 §6).
  const canManage = Boolean(merchantId) && hasAnyPermission(user.permissions, PERMISSION_GATES.bankAccountWrite);
  const state = await prefetchDehydrated(async (client) => {
    await client.prefetchQuery({
      ...bankAccountQueries.list(filter),
      queryFn: async () => unwrapOrRedirect(await listBankAccounts(filter)),
    });
  });
  return (
    <HydrationBoundary state={state}>
      <BankAccountsContainer filter={filter} canManage={canManage} />
    </HydrationBoundary>
  );
}
