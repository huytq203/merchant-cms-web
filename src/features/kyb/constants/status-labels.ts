import type { EnterpriseWallet, MerchantProfile } from "../types";

type BadgeTone = "success" | "warning" | "danger" | "secondary" | "outline";

type StatusLabel = { label: string; tone: BadgeTone };

export const WALLET_STATUS_LABELS: Record<EnterpriseWallet["verificationStatus"], StatusLabel> = {
  DRAFT: { label: "Chưa gửi hồ sơ", tone: "secondary" },
  PENDING_APPROVAL: { label: "Chờ duyệt KYB", tone: "warning" },
  VERIFIED: { label: "Đã xác thực", tone: "success" },
  REJECTED: { label: "Bị từ chối", tone: "danger" },
};

export const MERCHANT_STATUS_LABELS: Record<MerchantProfile["status"], StatusLabel> = {
  DRAFT: { label: "Bản nháp", tone: "secondary" },
  PENDING_APPROVAL: { label: "Chờ duyệt ĐVCNTT", tone: "warning" },
  ACTIVE: { label: "Hoạt động", tone: "success" },
  REJECTED: { label: "Bị từ chối", tone: "danger" },
  LOCKED: { label: "Đã khoá", tone: "outline" },
  TERMINATED: { label: "Đã chấm dứt", tone: "outline" },
};
