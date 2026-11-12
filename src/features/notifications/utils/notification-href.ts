import type { Notification } from "../types";

type HrefInput = Pick<Notification, "targetType" | "targetId" | "subMerchantId">;

/** Loại đích mở chi tiết theo id: trang danh sách + `?detail=<id>` (Task 20). */
const DETAIL_PAGE: Record<string, string> = {
  ORDER: "/order",
  WITHDRAWAL: "/withdrawal",
  REFUND: "/revenue-refunds",
  COMPLAINT: "/complaint",
  BANK_ACCOUNT: "/bank-accounts",
  SUB_MERCHANT: "/sub-merchants",
  USER: "/users",
};

/** Loại đích là trang danh sách cố định, không cần id. */
const LIST_PAGE: Record<string, string> = {
  ESCROW: "/escrow",
  SUB_BALANCE: "/sub-balances",
  WITHDRAWAL_LIST: "/withdrawal",
};

/**
 * Đường dẫn Portal mà một thông báo mở tới; bản FE của `InboxTargetLinks` ở BE, hai bên phải khớp nhau.
 * Loại theo id mà thiếu id thì rơi về trang danh sách trần, giống BE (`InboxTargetLinks.detail()`).
 * `null` = thông báo không có đích (NONE hoặc loại lạ BE thêm sau) nên bấm chỉ đánh dấu đã đọc.
 */
export function notificationHref(notification: HrefInput): string | null {
  const { targetType, targetId, subMerchantId } = notification;
  if (!targetType) return null;
  const detailPage = DETAIL_PAGE[targetType];
  if (detailPage) return targetId ? `${detailPage}?detail=${encodeURIComponent(targetId)}` : detailPage;
  const listPage = LIST_PAGE[targetType];
  if (listPage) return listPage;
  if (targetType === "FREEZE_LIST") {
    return subMerchantId ? `/revenue-freezes?subMerchantId=${encodeURIComponent(subMerchantId)}` : "/revenue-freezes";
  }
  return null;
}
