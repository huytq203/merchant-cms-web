import { redirect } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/page/PageHeader";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasPermission } from "@/features/auth/permissions";
import { BatchList } from "@/features/disbursements/components/BatchList";
import type { BatchListFilter } from "@/features/disbursements/types/types";
import { getServerSession } from "@/lib/auth/session";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const BATCH_STATUSES = ["DRAFT", "SUBMITTING", "COMPLETED", "EXPIRED"] as const;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const intParam = (value: string | undefined, fallback: number, max = Infinity) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : fallback;
};

/** Danh sách lô chi hộ: Sub và trạng thái lô lọc trên URL; giá trị lạ bị bỏ. Phạm vi Sub do BE giới hạn theo phiên. */
export default async function DisbursementBatchesPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (!hasPermission(user.permissions, "VIEW_DISBURSEMENT")) return <AccessDenied />;

  const raw = await searchParams;
  const subId = z.uuid().safeParse(first(raw.subId));
  const status = z.enum(BATCH_STATUSES).safeParse(first(raw.status));
  const filter: BatchListFilter = {
    page: intParam(first(raw.page), 1),
    pageSize: intParam(first(raw.pageSize), 10, 100),
    ...(subId.success ? { subId: subId.data } : {}),
    ...(status.success ? { status: status.data } : {}),
  };
  return (
    <div className="space-y-5">
      <PageHeader title="Lô chi hộ" />
      <BatchList filter={filter} />
    </div>
  );
}
