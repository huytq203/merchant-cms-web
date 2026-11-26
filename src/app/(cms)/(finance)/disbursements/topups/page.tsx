import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page/PageHeader";
import { ServerResultState } from "@/components/page/ServerResultState";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasPermission } from "@/features/auth/permissions";
import { ReceivingAccountCard, type TopupPurpose } from "@/features/disbursements/components/ReceivingAccountCard";
import { TopupList } from "@/features/disbursements/components/TopupList";
import { TOPUP_STATUS_OPTIONS } from "@/features/disbursements/utils/disbursement-mapper";
import { SubMerchantPicker } from "@/features/sub-merchants/components/SubMerchantPicker";
import { pickSubMerchantId } from "@/features/sub-merchants/utils/sub-merchant-choice";
import { domainErrorMessage } from "@/lib/be/errors";
import { getServerSession } from "@/lib/auth/session";
import { listDisbursementTopups, listReceivingAccounts } from "@/server/modules/disbursements/disbursement.service";
import { listSubMerchantChoices } from "@/server/modules/sub-merchants/sub-merchant-choices";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const PAGE_SIZE = 10;
const KNOWN_STATUSES = new Set(TOPUP_STATUS_OPTIONS.map((option) => option.value));

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const single = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

/**
 * Nạp tiền của Sub (chỉ xem): tài khoản bảo đảm để chuyển tiền kèm nút sao chép, và các lệnh nạp Kế toán đã/đang ghi
 * nhận. Portal không tự tạo hay ghi Có lệnh nạp.
 */
export default async function DisbursementTopupsPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (!hasPermission(user.permissions, "VIEW_DISBURSEMENT")) return <AccessDenied />;

  const query = await searchParams;
  const choices = await listSubMerchantChoices(user);
  if (!choices.success) {
    return <Shell><ServerResultState state="error" message={domainErrorMessage(choices.error)} /></Shell>;
  }
  const subId = pickSubMerchantId(choices.data, single(query.subMerchantId));
  if (!subId) {
    return <Shell><ServerResultState state="empty" message="Chưa có Sub-merchant nào để xem lệnh nạp." /></Shell>;
  }
  const status = single(query.status);
  const page = Math.max(1, Number.parseInt(single(query.page) ?? "1", 10) || 1);
  // Mục đích nạp quyết định TK nhận tiền: mặc định Chi hộ; Hoàn kèm giao dịch hoàn (refundId) thì đúng TK theo nguồn, chưa kèm thì chia hai nhóm theo nguồn.
  const purpose: TopupPurpose = single(query.purpose) === "HOAN" ? "HOAN" : "CHI_HO";
  const refundParam = single(query.refundId);
  const refundId = purpose === "HOAN" && refundParam && UUID_PATTERN.test(refundParam) ? refundParam : undefined;
  const [accounts, topups] = await Promise.all([
    listReceivingAccounts(subId, purpose, refundId),
    listDisbursementTopups(subId, { page, pageSize: PAGE_SIZE, ...(status && KNOWN_STATUSES.has(status) ? { status } : {}) }),
  ]);
  return (
    <Shell picker={<SubMerchantPicker choices={choices.data} value={subId} />}>
      <nav aria-label="Mục đích nạp" className="flex flex-wrap gap-2">
        {([["CHI_HO", "Nạp để chi hộ"], ["HOAN", "Nạp để hoàn"]] as const).map(([value, label]) => (
          <Link
            key={value}
            href={`/disbursements/topups?subMerchantId=${subId}&purpose=${value}`}
            aria-current={purpose === value ? "true" : undefined}
            className={`rounded-lg border px-3 py-1.5 text-sm ${purpose === value ? "border-primary bg-secondary font-semibold text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {accounts.success ? (
        <ReceivingAccountCard accounts={accounts.data} purpose={purpose} groupBySource={purpose === "HOAN" && !refundId} />
      ) : (
        <ServerResultState state="error" message={domainErrorMessage(accounts.error)} />
      )}
      {topups.success ? (
        <TopupList
          rows={topups.data.rows}
          total={topups.data.total}
          subId={subId}
          page={page}
          pageSize={PAGE_SIZE}
          status={status && KNOWN_STATUSES.has(status) ? status : undefined}
        />
      ) : (
        <ServerResultState state="error" message={domainErrorMessage(topups.error)} />
      )}
    </Shell>
  );
}

function Shell({ picker, children }: { picker?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-5">
      <PageHeader title="Nạp tiền chi hộ" description="Chuyển tiền vào tài khoản bảo đảm, Kế toán sẽ ghi nhận vào số dư thu-chi hộ của Sub-merchant." action={picker ? <div className="w-72 max-w-full">{picker}</div> : undefined} />
      {children}
    </div>
  );
}
