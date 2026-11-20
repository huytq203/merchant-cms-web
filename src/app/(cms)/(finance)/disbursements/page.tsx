import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import { ServerResultState } from "@/components/page/ServerResultState";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasPermission } from "@/features/auth/permissions";
import { DisbursementOverview } from "@/features/disbursements/components/DisbursementOverview";
import { SubMerchantPicker } from "@/features/sub-merchants/components/SubMerchantPicker";
import { pickSubMerchantId } from "@/features/sub-merchants/utils/sub-merchant-choice";
import { domainErrorMessage } from "@/lib/be/errors";
import { getServerSession } from "@/lib/auth/session";
import { getDisbursementOverview } from "@/server/modules/disbursements/disbursement.service";
import { listSubMerchantChoices } from "@/server/modules/sub-merchants/sub-merchant-choices";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Server-only: số dư đọc trực tiếp từ sổ cái mỗi lần mở trang; Sub chọn nằm trên URL. */
export default async function DisbursementsPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (!hasPermission(user.permissions, "VIEW_DISBURSEMENT")) return <AccessDenied />;

  const requested = (await searchParams).subMerchantId;
  const choices = await listSubMerchantChoices(user);
  const title = getRouteTitle("/disbursements");
  if (!choices.success) {
    return <Shell title={title}><ServerResultState state="error" message={domainErrorMessage(choices.error)} /></Shell>;
  }
  const subId = pickSubMerchantId(choices.data, typeof requested === "string" ? requested : undefined);
  if (!subId) {
    return <Shell title={title}><ServerResultState state="empty" message="Chưa có Sub-merchant nào để xem chi hộ." /></Shell>;
  }

  const overview = await getDisbursementOverview(subId);
  return (
    <Shell title={title} picker={<SubMerchantPicker choices={choices.data} value={subId} />}>
      {overview.success ? (
        <DisbursementOverview overview={overview.data} canCreate={hasPermission(user.permissions, "CREATE_DISBURSEMENT")} />
      ) : (
        <ServerResultState state="error" message={domainErrorMessage(overview.error)} />
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
