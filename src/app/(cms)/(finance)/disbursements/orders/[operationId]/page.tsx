import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/page/PageHeader";
import { ServerResultState } from "@/components/page/ServerResultState";
import { Button } from "@/components/ui/button/Button";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasPermission } from "@/features/auth/permissions";
import { DisbursementDetail } from "@/features/disbursements/components/DisbursementDetail";
import { getServerSession } from "@/lib/auth/session";
import { getDisbursementOrder } from "@/server/modules/disbursements/disbursement.service";
import { readFailureMessage } from "@/server/modules/disbursements/disbursement-response";
import { listSubMerchantChoices } from "@/server/modules/sub-merchants/sub-merchant-choices";

type Props = { params: Promise<{ operationId: string }> };

const NOT_FOUND = "Không tìm thấy lệnh chi hộ.";

/**
 * Chi tiết một lệnh chi hộ. BE trả 404 cho lệnh của Sub ngoài phạm vi phiên, nên lệnh của người khác và lệnh không tồn
 * tại giống hệt nhau. Chỉ UUID mới đi tiếp vào đường dẫn BE (chặn ký tự lạ như ..%2f).
 */
export default async function DisbursementOrderPage({ params }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (!hasPermission(user.permissions, "VIEW_DISBURSEMENT")) return <AccessDenied />;

  const { operationId } = await params;
  const [detail, choices] = z.uuid().safeParse(operationId).success
    ? await Promise.all([getDisbursementOrder(operationId), listSubMerchantChoices(user)])
    : [null, null];
  const sub = detail?.success && choices?.success ? choices.data.find((choice) => choice.id === detail.data.subId) : undefined;
  return (
    <div className="space-y-5">
      <PageHeader
        title="Chi tiết lệnh chi hộ"
        action={
          <Button variant="outline" nativeButton={false} render={<Link href="/disbursements/orders" role="link" />}>
            Về danh sách lệnh
          </Button>
        }
      />
      {detail === null || (!detail.success && detail.error.status === 404) ? (
        <ServerResultState state="empty" message={NOT_FOUND} />
      ) : detail.success ? (
        <DisbursementDetail detail={detail.data} subLabel={sub?.label} />
      ) : (
        <ServerResultState state="error" message={readFailureMessage(detail.error)} />
      )}
    </div>
  );
}
