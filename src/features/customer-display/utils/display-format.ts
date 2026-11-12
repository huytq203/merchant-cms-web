import { parseExpiredAt } from "@/features/orders/utils/order-mapper";

const NUMBER = new Intl.NumberFormat("vi-VN");

/** `152.200` — màn khách in chữ "đ" nhỏ phía sau như app mobile, nên không gắn đơn vị ở đây. */
export const formatVnd = (amount: number) => NUMBER.format(amount);

const TIME = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const DATE = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" });

/** `10:01 · 12/11/2026` theo giờ VN; BE gửi `paidAt` không múi giờ. */
export function formatPaidTime(paidAt: string | null | undefined, fallback: Date): string {
  const time = parseExpiredAt(paidAt) ?? fallback;
  return `${TIME.format(time)} · ${DATE.format(time)}`;
}

/** Tên nguồn tiền cho khách đọc: BE trả FLEXPAY_WALLET (ví) hoặc QR (chuyển khoản ngân hàng qua VietQR). */
export function paymentSourceLabel(paymentMethod: string | null | undefined): string {
  if (!paymentMethod || paymentMethod === "FLEXPAY_WALLET") return "Ví FlexPay";
  return "Chuyển khoản QR";
}
