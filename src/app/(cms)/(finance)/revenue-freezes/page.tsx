import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import { ServerResultState } from "@/components/page/ServerResultState";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasPermission } from "@/features/auth/permissions";
import { FreezeStatusControl } from "@/features/revenue-freezes/components/FreezeStatusControl";
import { FreezeTable } from "@/features/revenue-freezes/components/FreezeTable";
import { DEFAULT_FREEZE_STATUS } from "@/features/revenue-freezes/constants/freeze-labels";
import { freezeStatusFilterSchema } from "@/features/revenue-freezes/schemas";
import { SubMerchantPicker } from "@/features/sub-merchants/components/SubMerchantPicker";
import { pickSubMerchantId } from "@/features/sub-merchants/utils/sub-merchant-choice";
import { getServerSession } from "@/lib/auth/session";
import { domainErrorMessage } from "@/lib/be/errors";
import { listRevenueFreezes } from "@/server/modules/revenue-freezes/revenue-freeze.service";
import { listSubMerchantChoices } from "@/server/modules/sub-merchants/sub-merchant-choices";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Server-only, read-only (chốt 03/11/2026: Portal thấy từng khoản đóng băng kèm lý do). Freezing and releasing are
 * FlexPay's job, so there is no action here. The Sub and the status live in the URL; the permission is VIEW_BALANCE,
 * the one the BE checks, because a freeze is part of the Sub's balance.
 */
export default async function RevenueFreezesPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (!hasPermission(user.permissions, "VIEW_BALANCE")) return <AccessDenied />;

  const [params, choices] = await Promise.all([searchParams, listSubMerchantChoices(user)]);
  // An unknown status in the URL falls back to all rather than sending the BE a value it does not store.
  const status = freezeStatusFilterSchema.catch(DEFAULT_FREEZE_STATUS).parse(params.status ?? DEFAULT_FREEZE_STATUS);
  const title = getRouteTitle("/revenue-freezes");
  if (!choices.success) return <Shell title={title}><ServerResultState state="error" message={domainErrorMessage(choices.error)} /></Shell>;
  const subMerchantId = pickSubMerchantId(choices.data, typeof params.subMerchantId === "string" ? params.subMerchantId : undefined);
  if (!subMerchantId) return <Shell title={title}><ServerResultState state="empty" message="Chưa có Sub-merchant nào để xem khoản đóng băng." /></Shell>;

  const freezes = await listRevenueFreezes(subMerchantId, status);
  return (
    <Shell
      title={title}
      controls={(
        <>
          <div className="w-72 max-w-full"><SubMerchantPicker choices={choices.data} value={subMerchantId} /></div>
          <FreezeStatusControl value={status} />
        </>
      )}
    >
      {freezes.success
        ? <FreezeTable freezes={freezes.data} />
        : <ServerResultState state="error" message={domainErrorMessage(freezes.error)} />}
    </Shell>
  );
}

function Shell({ title, controls, children }: { title: string; controls?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        description="Các khoản doanh thu FlexPay đang giữ lại theo từng giao dịch. Phần còn hụt được bù dần từ doanh thu mới; tiền gỡ băng trở về số dư của Sub-merchant."
        action={controls ? <div className="flex flex-wrap items-end gap-4">{controls}</div> : undefined}
      />
      {children}
    </div>
  );
}
