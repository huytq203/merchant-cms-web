import type { MerchantProfile, MerchantStatusHistory } from "../types";

export type TimelineEntry = {
  title: string;
  description?: string;
  time?: string | null;
  variant: "default" | "success" | "warning" | "danger";
};

function latestSubmittedAt(history: readonly MerchantStatusHistory[]) {
  const submitted = history
    .filter((entry) => entry.toStatus === "PENDING_APPROVAL" && entry.occurredAt)
    .map((entry) => entry.occurredAt as string)
    .sort();
  return submitted.at(-1) ?? null;
}

/** Three-step progress of the ĐVCNTT dossier; only statuses that went through review have one. */
export function merchantTimeline(
  merchant: Pick<MerchantProfile, "status" | "rejectedReasonDetail" | "rejectedAt">,
  history: readonly MerchantStatusHistory[],
): TimelineEntry[] {
  const { status } = merchant;
  if (status === "DRAFT" || status === "LOCKED" || status === "TERMINATED") return [];
  const submitted: TimelineEntry = {
    title: "Đã gửi hồ sơ",
    time: latestSubmittedAt(history),
    variant: "success",
  };
  if (status === "PENDING_APPROVAL") {
    return [
      submitted,
      { title: "Flexpay đang thẩm định", description: "Đang chờ xử lý", variant: "warning" },
      { title: "Kích hoạt hoặc từ chối", description: "Đang chờ kết quả", variant: "default" },
    ];
  }
  const reviewed: TimelineEntry = { title: "Flexpay đã thẩm định", variant: "success" };
  if (status === "REJECTED") {
    return [
      submitted,
      reviewed,
      {
        title: "Bị từ chối",
        description: merchant.rejectedReasonDetail ?? undefined,
        time: merchant.rejectedAt,
        variant: "danger",
      },
    ];
  }
  return [submitted, reviewed, { title: "Đã kích hoạt", variant: "success" }];
}
