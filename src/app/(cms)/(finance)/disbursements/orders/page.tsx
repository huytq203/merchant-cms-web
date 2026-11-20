import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page/PageHeader";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasPermission } from "@/features/auth/permissions";
import { DisbursementList } from "@/features/disbursements/components/DisbursementList";
import { parseOrderSearchParams } from "@/features/disbursements/utils/disbursement-filter-mapper";
import { getServerSession } from "@/lib/auth/session";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Lịch sử lệnh chi hộ. Bộ lọc đọc từ URL; danh sách tải ở trình duyệt để lỗi đọc (503) có nút thử lại mà không làm hỏng
 * cả trang. Nút Xuất CSV chỉ hiện với EXPORT_DISBURSEMENT (BE kiểm lại). Phạm vi Sub do BE giới hạn theo phiên.
 */
export default async function DisbursementOrdersPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (!hasPermission(user.permissions, "VIEW_DISBURSEMENT")) return <AccessDenied />;

  const filter = parseOrderSearchParams(await searchParams);
  return (
    <div className="space-y-5">
      <PageHeader title="Lịch sử chi hộ" />
      <DisbursementList filter={filter} canExport={hasPermission(user.permissions, "EXPORT_DISBURSEMENT")} />
    </div>
  );
}
