import type { EnterpriseWallet } from "../types";
import type { TimelineEntry } from "./merchant-timeline";

/**
 * Review progress of the KYB dossier. The wallet carries no status trail, and a dossier under review
 * cannot be edited, so its last update is the moment it was sent.
 */
export function kybTimeline(
  wallet: Pick<EnterpriseWallet, "verificationStatus" | "kybRejectedReason" | "kybRejectedAt" | "updatedAt">,
): TimelineEntry[] {
  const submitted: TimelineEntry = { title: "Đã gửi hồ sơ", time: wallet.updatedAt, variant: "success" };
  if (wallet.verificationStatus === "PENDING_APPROVAL") {
    return [
      submitted,
      { title: "Flexpay đang thẩm định", description: "Thường 1 đến 2 ngày làm việc", variant: "warning" },
      { title: "Xác thực hoặc từ chối", description: "Đang chờ kết quả", variant: "default" },
    ];
  }
  return [];
}
