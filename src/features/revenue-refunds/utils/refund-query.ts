import { shiftVnDate } from "@/lib/utils/vn-time";
import { REFUND_GROUPS } from "../constants/refund-status";
import type { RefundFilter, RefundPeriod, RefundQuery } from "../types";

/** Kỳ mặc định khi vào màn: 7 ngày gần nhất (chốt tối ưu Portal 10/11/2026). */
export const DEFAULT_REFUND_PERIOD: RefundPeriod = "7d";

export const REFUND_PERIOD_OPTIONS: { value: RefundPeriod; label: string }[] = [
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "custom", label: "Tùy chỉnh" },
];

/**
 * Đổi kỳ thành ngày `yyyy-MM-dd` giờ Việt Nam mà BE nhận (`to` gồm cả ngày đó). "7 ngày" = hôm nay + 6 ngày trước, nên
 * một kỳ cố định luôn đúng số ngày lịch. Kỳ tùy chỉnh để hở phía bỏ trống.
 */
export function refundPeriodToDates(filter: Pick<RefundFilter, "period" | "from" | "to">, today: string): { from?: string; to?: string } {
  const period = filter.period ?? DEFAULT_REFUND_PERIOD;
  if (period === "custom") return { ...(filter.from ? { from: filter.from } : {}), ...(filter.to ? { to: filter.to } : {}) };
  return { from: shiftVnDate(today, period === "7d" ? -6 : -29), to: today };
}

/** Bộ lọc trên URL → tham số gửi BE. Nhóm trạng thái và `status` đơn hợp lại thành một danh sách `statuses`. */
export function toRefundQuery(filter: RefundFilter, today: string): RefundQuery {
  const statuses = new Set<string>(filter.group ? REFUND_GROUPS[filter.group].statuses : []);
  if (filter.status) statuses.add(filter.status);
  return {
    ...(filter.q ? { q: filter.q } : {}),
    ...(statuses.size > 0 ? { statuses: [...statuses].join(",") } : {}),
    ...(filter.orderId ? { orderId: filter.orderId } : {}),
    ...(filter.subMerchantId ? { subMerchantId: filter.subMerchantId } : {}),
    ...refundPeriodToDates(filter, today),
  };
}

/** Chuỗi query (không có dấu `?`) để gọi route handler / tải file; bỏ trường rỗng. */
export function refundQueryString(query: RefundQuery, omit: (keyof RefundQuery)[] = []): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value && !omit.includes(key as keyof RefundQuery)) params.set(key, String(value));
  }
  return params.toString();
}

/** Bộ lọc → query của URL trang (chỉ giữ trường có giá trị; kỳ mặc định không cần ghi). */
export function refundFilterToSearch(filter: RefundFilter): string {
  const params = new URLSearchParams();
  const put = (key: string, value: string | undefined) => value && params.set(key, value);
  put("q", filter.q);
  put("group", filter.group);
  put("status", filter.status);
  put("subMerchantId", filter.subMerchantId);
  put("orderId", filter.orderId);
  if (filter.period && filter.period !== DEFAULT_REFUND_PERIOD) params.set("period", filter.period);
  if (filter.period === "custom") {
    put("from", filter.from);
    put("to", filter.to);
  }
  return params.toString();
}
