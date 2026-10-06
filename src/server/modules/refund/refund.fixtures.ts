import type { Refund, RefundStatus } from "@/features/refund/types/type";

/**
 * Static sample data for development (MERCHANT_API_MODE=fixture). Nothing here is real:
 * names are placeholders and card numbers are fully masked.
 */
const SUB_MERCHANTS = [
  { id: "SM001", name: "Cửa hàng mẫu A" },
  { id: "SM002", name: "Cửa hàng mẫu B" },
  { id: "SM003", name: "Cửa hàng mẫu C" },
] as const;

const STATUSES: readonly RefundStatus[] = ["pending", "success", "approved", "rejected", "success", "pending", "cancelled"];
const REASONS: readonly (string | null)[] = [
  "Khách hàng đổi ý",
  "Giao dịch trùng lặp",
  null,
  "Sản phẩm không đúng mô tả",
];
const BASE_TIME = Date.UTC(2026, 8, 5, 2, 0, 0);
const DAY_MS = 86_400_000;

function sampleRefund(index: number): Refund {
  const number = String(index + 1).padStart(3, "0");
  const subMerchant = SUB_MERCHANTS[index % SUB_MERCHANTS.length]!;
  const status = STATUSES[index % STATUSES.length]!;
  const requestAmount = (index + 1) * 90_000;
  const feeMb = Math.round(requestAmount * 0.005);
  const createdAt = BASE_TIME + index * DAY_MS;
  return {
    id: `sample-refund-${number}`,
    code: `REF-SAMPLE-${number}`,
    transactionId: `sample-trx-${number}`,
    transactionCode: `TRX-SAMPLE-${number}`,
    invoiceCode: index % 3 === 2 ? null : `INV-SAMPLE-${number}`,
    subMerchantId: subMerchant.id,
    subMerchantName: subMerchant.name,
    requestAmount,
    actualAmount: (status === "rejected" || status === "cancelled") ? 0 : requestAmount - feeMb,
    feeMb,
    feeNm: 0,
    recipientName: `Người nhận mẫu ${number}`,
    recipientCard: index % 4 === 3 ? null : `**** **** **** ${String(index + 1).padStart(4, "0")}`,
    createdBy: index % 5 === 4 ? null : `Nhân viên mẫu ${String(index % 3 + 1).padStart(2, "0")}`,
    reason: REASONS[index % REASONS.length]!,
    status,
    createdAt: new Date(createdAt).toISOString(),
    updatedAt: status === "pending" ? null : new Date(createdAt + DAY_MS / 4).toISOString(),
  };
}

/** Newest first, like the list the BE will return. */
export const REFUND_FIXTURES: readonly Refund[] = Array.from({ length: 12 }, (_, index) =>
  sampleRefund(index),
).reverse();
