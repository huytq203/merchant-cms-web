import type { Order, OrderFormData, OrderStatus } from "../schemas/order.schema";

const BUSINESS_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** BE only re-issues a QR for an order that is still ACTIVE (unpaid). */
export function canRefreshQr(status: OrderStatus): boolean {
  return status === "ACTIVE";
}

/** The order is unpaid but its payment window has already closed, so the old QR must not be shown. */
export function isOrderQrExpired(order: Pick<Order, "status" | "expiredAt">, now: Date): boolean {
  if (order.status !== "ACTIVE" || !order.expiredAt) return false;
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(order.expiredAt);
  const expiresAt = new Date(hasZone ? order.expiredAt : `${order.expiredAt}+07:00`);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= now.getTime();
}

/** BE reads `expiredAt` as a zone-less LocalDateTime in business time (UTC+7). */
export function toExpiredAt(minutes: number | undefined, now: Date): string | undefined {
  if (!minutes || minutes <= 0) return undefined;
  const target = new Date(now.getTime() + minutes * 60_000);
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(target);
  return parts.replace(" ", "T");
}

export function toOrderCreateRequest(values: OrderFormData, merchantId: string, now: Date = new Date()) {
  const expiredAt = toExpiredAt(values.expiryMinutes, now);
  return {
    merchantId,
    orderCode: values.orderCode,
    amount: values.amount,
    bankCode: values.bankCode,
    currency: values.currency,
    paymentMethod: values.paymentMethod,
    ...(values.orderDescription ? { orderDescription: values.orderDescription } : {}),
    ...(expiredAt ? { expiredAt } : {}),
    ...(values.subMerchantId ? { subMerchantId: values.subMerchantId } : {}),
  };
}
