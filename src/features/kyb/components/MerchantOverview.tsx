"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge/Badge";
import { formatDate } from "@/lib/utils/helper";
import { formatBusinessCategory } from "@/features/business-categories/utils";
import { MERCHANT_STATUS_LABELS } from "../constants/status-labels";
import { kybQueries } from "../kyb-queries";
import type { MerchantProfile } from "../types";
import { merchantTimeline } from "../utils/merchant-timeline";
import { DetailRow } from "./DetailRow";
import { MerchantProcessSteps } from "./MerchantProcessSteps";

type Props = { merchant: MerchantProfile };

/** Only http(s) addresses become a link, so a stored value can never run script when clicked. */
function WebsiteLink({ url }: { url: string | null | undefined }) {
  const safe = url && /^https?:\/\//i.test(url.trim()) ? url.trim() : null;
  if (!url) return <>—</>;
  if (!safe) return <>{url}</>;
  return (
    <a
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      title={safe}
      className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      Liên kết website
      <ExternalLink className="size-3.5" aria-hidden />
      <span className="sr-only">(mở trong tab mới)</span>
    </a>
  );
}

function SubmittedInfo({ merchant }: { merchant: MerchantProfile }) {
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <DetailRow label="Tên hiển thị" value={merchant.name ?? ""} />
      <DetailRow label="Ngành nghề (MCC)" value={formatBusinessCategory(merchant.businessCategory, merchant.mccCode)} />
      <DetailRow label="Người liên hệ / Hotline" value={merchant.supportContact ?? ""} />
      <DetailRow label="Website">
        <WebsiteLink url={merchant.websiteUrl} />
      </DetailRow>
      <DetailRow label="Hợp đồng ĐVCNTT" value={merchant.contractFile?.filename ?? ""} />
      <DetailRow label="Ký hợp đồng riêng từng Sub-merchant" value={merchant.contractSignedWithSub ? "Có" : "Không"} />
      <DetailRow label="Cập nhật lúc" value={merchant.updatedAt ? formatDate(merchant.updatedAt) : ""} />
    </dl>
  );
}

/** A dossier that is under review, live, locked or terminated: read only. */
export function MerchantOverview({ merchant }: Props) {
  const history = useQuery(kybQueries.history(merchant.id, 1));
  const status = MERCHANT_STATUS_LABELS[merchant.status];
  const steps = merchantTimeline(merchant, history.data?.rows ?? []);
  const submittedAt = steps[0]?.time;
  return (
    <section className="grid gap-5" aria-labelledby="merchant-card-title">
      <header className="flex flex-wrap items-center gap-3">
        <h2 id="merchant-card-title" className="text-base font-semibold">Hồ sơ ĐVCNTT</h2>
        <Badge variant={status.tone}>{status.label}</Badge>
        {submittedAt && <span className="text-xs text-muted-foreground">Gửi lúc {formatDate(submittedAt)}</span>}
      </header>
      {merchant.status === "PENDING_APPROVAL" && (
        <p className="flex items-start gap-2 text-sm text-muted-foreground" role="status">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
          Flexpay thường duyệt trong 1 đến 2 ngày làm việc. Trong thời gian chờ, hồ sơ chỉ xem, không thể chỉnh sửa. Khi duyệt đạt, hệ thống tự sinh một Sub-merchant mặc định.
        </p>
      )}
      {steps.length > 0 && <MerchantProcessSteps steps={steps} />}
      <SubmittedInfo merchant={merchant} />
    </section>
  );
}
