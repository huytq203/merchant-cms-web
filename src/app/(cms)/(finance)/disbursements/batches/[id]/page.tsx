import { redirect } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/page/PageHeader";
import { ServerResultState } from "@/components/page/ServerResultState";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasPermission } from "@/features/auth/permissions";
import { BatchSummary } from "@/features/disbursements/components/BatchSummary";
import { domainErrorMessage } from "@/lib/be/errors";
import { getServerSession } from "@/lib/auth/session";
import { getDisbursementBatch } from "@/server/modules/disbursements/disbursement.service";

type Props = { params: Promise<{ id: string }> };

/** Chi tiết lô chi hộ: tóm tắt, file lỗi, từng dòng và nút gửi lô (OTP). BE kiểm lô thuộc phạm vi phiên. */
export default async function DisbursementBatchPage({ params }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (!hasPermission(user.permissions, "VIEW_DISBURSEMENT")) return <AccessDenied />;

  const { id } = await params;
  // Chỉ UUID mới đi tiếp vào đường dẫn BE (chặn ký tự lạ như ..%2f).
  const detail = z.uuid().safeParse(id).success ? await getDisbursementBatch(id) : null;
  return (
    <div className="space-y-5">
      <PageHeader title="Chi tiết lô chi hộ" />
      {detail === null ? (
        <ServerResultState state="empty" message="Không tìm thấy lô chi hộ." />
      ) : detail.success ? (
        <BatchSummary initial={detail.data} canCreate={hasPermission(user.permissions, "CREATE_DISBURSEMENT")} />
      ) : (
        <ServerResultState state="error" message={domainErrorMessage(detail.error)} />
      )}
    </div>
  );
}
