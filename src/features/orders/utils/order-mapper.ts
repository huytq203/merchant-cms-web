import type { Order, OrderFormData, OrderStatus } from "../schemas/order.schema";

const BUSINESS_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** BE only re-issues a QR for an order that is still ACTIVE (unpaid). */
export function canRefreshQr(status: OrderStatus): boolean {
  return status === "ACTIVE";
}

/** `expiredAt` arrives zone-less in business time (UTC+7); null when absent or unreadable. */
export function parseExpiredAt(expiredAt: string | null | undefined): Date | null {
  if (!expiredAt) return null;
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(expiredAt);
  const parsed = new Date(hasZone ? expiredAt : `${expiredAt}+07:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** The order is unpaid but its payment window has already closed, so the old QR must not be shown. */
export function isOrderQrExpired(order: Pick<Order, "status" | "expiredAt">, now: Date): boolean {
  if (order.status !== "ACTIVE") return false;
  const expiresAt = parseExpiredAt(order.expiredAt);
  return expiresAt !== null && expiresAt.getTime() <= now.getTime();
}

/** `HH:MM:SS` until the QR closes; hours keep counting past 24 so a long window stays readable. */
export function formatCountdown(expiredAt: string | null | undefined, now: Date): string | null {
  const expiresAt = parseExpiredAt(expiredAt);
  if (!expiresAt) return null;
  const seconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
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
    ...(values.terminalId ? { terminalId: values.terminalId } : {}),
  };
}
