"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge/Badge";
import { Button } from "@/components/ui/button/Button";
import { Timeline } from "@/components/ui/timeline/Timeline";
import { formatDate } from "@/lib/utils/helper";
import { MERCHANT_STATUS_LABELS } from "../constants/status-labels";
import { kybQueries } from "../kyb-queries";
import type { MerchantProfile } from "../types";
import { merchantTimeline } from "../utils/merchant-timeline";
import { canEditMerchant } from "../utils/merchant-mapper";
import { DetailRow } from "./DetailRow";

type Props = {
  merchant: MerchantProfile;
  onOpenForm: () => void;
};

export function MerchantProfileCard({ merchant, onOpenForm }: Props) {
  const history = useQuery(kybQueries.history(merchant.id, 1));
  const status = MERCHANT_STATUS_LABELS[merchant.status];
  const steps = merchantTimeline(merchant, history.data?.rows ?? []);
  return (
    <section className="grid gap-4 rounded-xl border border-border bg-background p-4" aria-labelledby="merchant-card-title">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 id="merchant-card-title" className="text-base font-semibold">Hồ sơ ĐVCNTT</h2>
          <Badge variant={status.tone}>{status.label}</Badge>
        </div>
        {canEditMerchant(merchant) && (
          <Button type="button" variant="solid" onClick={onOpenForm}>
            {merchant.status === "REJECTED" ? "Chỉnh sửa và gửi lại" : "Đăng ký ĐVCNTT"}
          </Button>
        )}
      </header>
      {merchant.status === "REJECTED" && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{merchant.rejectedReasonDetail ?? "Hồ sơ ĐVCNTT bị từ chối"}</p>
        </div>
      )}
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DetailRow label="Tên hiển thị" value={merchant.name ?? ""} />
        <DetailRow label="Mã ngành nghề (MCC)" value={merchant.mccCode ?? ""} />
        <DetailRow label="Cập nhật lúc" value={merchant.updatedAt ? formatDate(merchant.updatedAt) : ""} />
      </dl>
      {steps.length > 0 && (
        <div className="grid gap-2">
          <h3 className="text-sm font-semibold">Tiến trình xử lý hồ sơ</h3>
          <Timeline
            size="sm"
            items={steps.map((step) => ({
              title: step.title,
              description: step.description,
              time: step.time ? formatDate(step.time) : undefined,
              variant: step.variant,
            }))}
          />
        </div>
      )}
    </section>
  );
}
