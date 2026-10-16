import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import { ServerResultState } from "@/components/page/ServerResultState";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasPermission } from "@/features/auth/permissions";
import { SubBalanceView } from "@/features/sub-balances/components/SubBalanceView";
import { subBalanceErrorMessage } from "@/features/sub-balances/utils/sub-balance-error";
import { SubMerchantPicker } from "@/features/sub-merchants/components/SubMerchantPicker";
import { pickSubMerchantId } from "@/features/sub-merchants/utils/sub-merchant-choice";
import { domainErrorMessage } from "@/lib/be/errors";
import { getServerSession } from "@/lib/auth/session";
import { getSubBalance } from "@/server/modules/sub-balances/sub-balance.service";
import { listSubMerchantChoices } from "@/server/modules/sub-merchants/sub-merchant-choices";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Server-only: the BE reads the ledger live on every call, and the page only changes when the Sub or a refresh changes. */
export default async function SubBalancesPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (!hasPermission(user.permissions, "VIEW_BALANCE")) return <AccessDenied />;

  const requested = (await searchParams).subMerchantId;
  const choices = await listSubMerchantChoices(user);
  const title = getRouteTitle("/sub-balances");
  if (!choices.success) {
    return <Shell title={title}><ServerResultState state="error" message={domainErrorMessage(choices.error)} /></Shell>;
  }
  const subMerchantId = pickSubMerchantId(choices.data, typeof requested === "string" ? requested : undefined);
  if (!subMerchantId) {
    return <Shell title={title}><ServerResultState state="empty" message="Chưa có Sub-merchant nào để xem số dư." /></Shell>;
  }

  const report = await getSubBalance(subMerchantId);
  return (
    <Shell title={title} picker={<SubMerchantPicker choices={choices.data} value={subMerchantId} />}>
      {report.success ? (
        <SubBalanceView report={report.data} canWithdraw={hasPermission(user.permissions, "CREATE_WITHDRAWAL")} />
      ) : (
        <ServerResultState state="error" message={subBalanceErrorMessage(report.error)} />
      )}
    </Shell>
  );
}

function Shell({ title, picker, children }: { title: string; picker?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-5">
      <PageHeader title={title} action={picker ? <div className="w-72 max-w-full">{picker}</div> : undefined} />
      {children}
    </div>
  );
}
