import { parseExpiredAt } from "@/features/orders/utils/order-mapper";
import type { CustomerDisplay, CustomerDisplayStatus } from "../schemas";

export type DisplayPhase = "waiting" | "paid" | "closed";

/**
 * Trạng thái coi như khách đã trả: tiền đã về (PAYMENT_CONFIRMED) là đủ để màn báo thành công,
 * không chờ tới lúc ghi có merchant (CREDIT_*, SUCCESS). PAID là trạng thái của QR tĩnh.
 */
const PAID_STATUSES = new Set([
  "PAYMENT_CONFIRMED",
  "CREDIT_PENDING",
  "CREDIT_POSTING",
  "CREDIT_RECONCILIATION_REQUIRED",
  "SUCCESS",
  "PAID",
]);

/** Đơn không còn trả được nữa: màn thôi hiện mã để khách không quét mã chết. */
const CLOSED_STATUSES = new Set(["EXPIRED", "CANCELLED", "FAILED"]);

/** Trạng thái lạ (BE thêm sau) vẫn giữ mã trên màn: an toàn hơn là báo nhầm "đã thanh toán". */
export function classifyStatus(status: string): DisplayPhase {
  if (PAID_STATUSES.has(status)) return "paid";
  if (CLOSED_STATUSES.has(status)) return "closed";
  return "waiting";
}

/**
 * Chọn tư thế Flexie theo mã đơn (FNV-1a 32 bit): ngẫu nhiên giữa các đơn nhưng cố định cho cùng một đơn,
 * để tải lại màn vẫn ra cùng linh vật như mock up đã duyệt.
 */
export function flexieIndex(seed: string, count: number): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % count;
}

/**
 * Chỉ khi khách chịu phí (`feeBearer = SENDER`) và phí dương mới hiện "Đơn hàng + Phí = Tổng".
 * Cửa hàng chịu phí (MERCHANT) thì BE vẫn trả `fee` nhưng khách không trả thêm, nên ẩn dòng phí.
 */
export function hasCustomerFee(display: Pick<CustomerDisplay, "fee" | "feeBearer">): boolean {
  return display.feeBearer === "SENDER" && (display.fee ?? 0) > 0;
}

/**
 * QR tĩnh: BE trả "lần trả gần nhất trong 10 giây", nên cùng một lần trả xuất hiện ở vài lượt hỏi liên tiếp.
 * Chỉ báo thành công khi `paidAt` khác lần đã báo, để màn không nháy lại cho cùng một khách.
 */
export function isNewStaticPayment(
  status: Pick<CustomerDisplayStatus, "status" | "paidAt">,
  lastSeenPaidAt: string | null,
): boolean {
  return classifyStatus(status.status) === "paid" && Boolean(status.paidAt) && status.paidAt !== lastSeenPaidAt;
}

/** `mm:ss` còn lại của mã (BE gửi giờ VN không múi giờ); null khi không có hạn. */
export function formatRemaining(expiresAt: string | null | undefined, now: Date): string | null {
  const end = parseExpiredAt(expiresAt);
  if (!end) return null;
  const seconds = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}
