import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import { ServerResultState } from "@/components/page/ServerResultState";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasPermission } from "@/features/auth/permissions";
import { HoldCalendarView } from "@/features/hold-calendar/components/HoldCalendarView";
import { HoldRangeControl } from "@/features/hold-calendar/components/HoldRangeControl";
import { DEFAULT_HOLD_RANGE } from "@/features/hold-calendar/constants/hold-labels";
import { holdRangeSchema } from "@/features/hold-calendar/schemas";
import { SubMerchantPicker } from "@/features/sub-merchants/components/SubMerchantPicker";
import { pickSubMerchantId } from "@/features/sub-merchants/utils/sub-merchant-choice";
import { getServerSession } from "@/lib/auth/session";
import { domainErrorMessage } from "@/lib/be/errors";
import { vnToday } from "@/lib/utils/vn-time";
import { getHoldCalendar } from "@/server/modules/hold-calendar/hold-calendar.service";
import { listSubMerchantChoices } from "@/server/modules/sub-merchants/sub-merchant-choices";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Server-only: a read-only forecast that changes only with the Sub or the range, both kept in the URL. */
export default async function HoldCalendarPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (!hasPermission(user.permissions, "VIEW_HOLD")) return <AccessDenied />;

  const [params, choices] = await Promise.all([searchParams, listSubMerchantChoices(user)]);
  const range = holdRangeSchema.catch(DEFAULT_HOLD_RANGE).parse(params.range);
  const title = getRouteTitle("/hold-calendar");
  if (!choices.success) return <Shell title={title}><ServerResultState state="error" message={domainErrorMessage(choices.error)} /></Shell>;
  const subMerchantId = pickSubMerchantId(choices.data, typeof params.subMerchantId === "string" ? params.subMerchantId : undefined);
  if (!subMerchantId) return <Shell title={title}><ServerResultState state="empty" message="Chưa có Sub-merchant nào để xem lịch tạm giữ." /></Shell>;

  const calendar = await getHoldCalendar(subMerchantId, range);
  return (
    <Shell
      title={title}
      controls={(
        <>
          <div className="w-72 max-w-full"><SubMerchantPicker choices={choices.data} value={subMerchantId} /></div>
          <HoldRangeControl value={range} />
        </>
      )}
    >
      {calendar.success
        ? <HoldCalendarView calendar={calendar.data} today={vnToday()} />
        : <ServerResultState state="error" message={domainErrorMessage(calendar.error)} />}
    </Shell>
  );
}

function Shell({ title, controls, children }: { title: string; controls?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        description="Dự báo ngày các khoản tạm giữ trở thành số dư khả dụng."
        action={controls ? <div className="flex flex-wrap items-end gap-4">{controls}</div> : undefined}
      />
      {children}
    </div>
  );
}
