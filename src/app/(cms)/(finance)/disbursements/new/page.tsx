import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page/PageHeader";
import { ServerResultState } from "@/components/page/ServerResultState";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasPermission } from "@/features/auth/permissions";
import { DisbursementCreateContainer } from "@/features/disbursements/components/DisbursementCreateContainer";
import { availableModes } from "@/features/disbursements/utils/disbursement-mapper";
import { SubMerchantPicker } from "@/features/sub-merchants/components/SubMerchantPicker";
import { pickSubMerchantId } from "@/features/sub-merchants/utils/sub-merchant-choice";
import { domainErrorMessage } from "@/lib/be/errors";
import { getServerSession } from "@/lib/auth/session";
import { getDisbursementOverview } from "@/server/modules/disbursements/disbursement.service";
import { listSubMerchantChoices } from "@/server/modules/sub-merchants/sub-merchant-choices";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Tạo lệnh chi hộ. Cần CREATE_DISBURSEMENT (tạo/tra tên/OTP) và VIEW_DISBURSEMENT (đọc cấu hình hình thức của Sub). Hình
 * thức hiện ra theo cấu hình Admin đã bật cho Sub: không bật đơn lẻ/lô thì không có form tương ứng.
 */
export default async function NewDisbursementPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (!hasPermission(user.permissions, "CREATE_DISBURSEMENT") || !hasPermission(user.permissions, "VIEW_DISBURSEMENT")) {
    return <AccessDenied />;
  }

  const requested = (await searchParams).subMerchantId;
  const choices = await listSubMerchantChoices(user);
  if (!choices.success) {
    return <Shell><ServerResultState state="error" message={domainErrorMessage(choices.error)} /></Shell>;
  }
  const subId = pickSubMerchantId(choices.data, typeof requested === "string" ? requested : undefined);
  if (!subId) {
    return <Shell><ServerResultState state="empty" message="Chưa có Sub-merchant nào để chi hộ." /></Shell>;
  }
  const overview = await getDisbursementOverview(subId);
  const picker = <SubMerchantPicker choices={choices.data} value={subId} />;
  if (!overview.success) {
    return <Shell picker={picker}><ServerResultState state="error" message={domainErrorMessage(overview.error)} /></Shell>;
  }
  const modes = availableModes(overview.data.service);
  if (!modes.single && !modes.batch) {
    return (
      <Shell picker={picker}>
        <ServerResultState state="empty" message="Sub-merchant này chưa bật chi hộ đơn lẻ hoặc theo lô." />
      </Shell>
    );
  }
  // key theo Sub: đổi Sub dựng lại toàn bộ luồng để không giữ mã yêu cầu/người nhận của Sub trước.
  return <Shell picker={picker}><DisbursementCreateContainer key={subId} subId={subId} modes={modes} /></Shell>;
}

function Shell({ picker, children }: { picker?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <PageHeader title="Tạo lệnh chi hộ" action={picker ? <div className="w-72 max-w-full">{picker}</div> : undefined} />
      {children}
    </div>
  );
}
