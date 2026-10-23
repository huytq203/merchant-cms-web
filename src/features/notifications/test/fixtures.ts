import type { Notification } from "../types";

/** Inbox row shaped like the BE contract; ids are fixed UUIDs so tests can address rows. */
export function notificationRow(index: number, overrides: Partial<Notification> = {}): Notification {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    type: "TRANSACTION_RESULT",
    title: `Giao dịch thành công ${index}`,
    body: `Đơn ORD-${index} · 1.000 ₫ · Cửa hàng A`,
    orderId: null,
    subMerchantId: null,
    createdAt: "2026-10-20T08:00:00Z",
    readAt: null,
    ...overrides,
  };
}
