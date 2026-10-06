import { HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { hasPermission } from "@/features/auth/permissions";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { prefetchDehydrated, unwrapOrRedirect } from "@/lib/query/prefetch";
import { listBankAccounts } from "@/server/modules/bank-accounts/bank-account.service";
import { BANK_ACCOUNT_PERMISSION } from "@/server/modules/bank-accounts/require-bank-account-access";
import { bankAccountQueries, parseBankAccountSearchParams } from "@/features/bank-accounts/bank-account-queries";
import { BankAccountsContainer } from "@/features/bank-accounts/components/BankAccountsContainer";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function BankAccountsPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  const merchantId = user.merchantIds[0];
  if (!hasPermission(user.permissions, BANK_ACCOUNT_PERMISSION) || !merchantId) {
    return <AccessDenied />;
  }
  const filter = { ...parseBankAccountSearchParams(await searchParams), merchantId };
  const state = await prefetchDehydrated(async (client) => {
    await client.prefetchQuery({
      ...bankAccountQueries.list(filter),
      queryFn: async () => unwrapOrRedirect(await listBankAccounts(filter)),
    });
  });
  return (
    <HydrationBoundary state={state}>
      <BankAccountsContainer filter={filter} />
    </HydrationBoundary>
  );
}
