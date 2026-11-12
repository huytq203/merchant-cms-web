import "server-only";

import { randomUUID } from "crypto";
import type { Order } from "@/features/orders/schemas/order.schema";
import type { CustomerDisplay, CustomerDisplayStatus } from "@/features/customer-display/schemas";
import type { StaticQr, StaticQrCreate } from "@/features/static-qrs/schemas";

/**
 * Dữ liệu giả cho dev local khi `MERCHANT_API_MODE=fixture` (không bao giờ chạy ở production, xem `resolveModuleSource`).
 * BE flex.merchant chưa có các API này trên dev (12/11/2026); fixture bám đúng hợp đồng để Portal làm trước.
 * Lưu trong bộ nhớ tiến trình (gắn vào globalThis để HMR không xóa); khởi động lại dev server là mất.
 *
 * Hành vi để thử tay:
 * - Đơn: tự thành "SUCCESS" sau `CUSTOMER_DISPLAY_FIXTURE_PAY_AFTER_MS` (mặc định 20 giây) kể từ lúc mở màn.
 * - Phí khách chịu: `CUSTOMER_DISPLAY_FIXTURE_FEE` (mặc định 0 = merchant chịu phí).
 * - QR tĩnh: mỗi chu kỳ 30 giây có một lần trả, báo PAID trong 10 giây như thiết kế.
 */

type DisplayEntry = { kind: "ORDER" | "STATIC_QR"; createdAt: number; orderCode: string; amount: number | null; staticQrId?: string };
type FixtureState = { displays: Map<string, DisplayEntry>; staticQrs: Map<string, StaticQr> };

const STATIC_CYCLE_MS = 30_000;
const STATIC_PAID_FROM_MS = 15_000;
const STATIC_PAID_WINDOW_MS = 10_000;

const globalStore = globalThis as typeof globalThis & { __customerDisplayFixture?: FixtureState };

function state(): FixtureState {
  globalStore.__customerDisplayFixture ??= { displays: new Map(), staticQrs: new Map() };
  return globalStore.__customerDisplayFixture;
}

const envNumber = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

/** Giờ VN không múi giờ, đúng kiểu LocalDateTime BE trả. */
function vnLocal(time: number): string {
  return new Date(time + 7 * 3_600_000).toISOString().slice(0, 19);
}

/** CRC-16/CCITT-FALSE của EMVCo (tag 63) để chuỗi giả trông và quét như mã thật. */
function crc16(text: string): string {
  let crc = 0xffff;
  for (const byte of Buffer.from(text, "utf8")) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const tlv = (tag: string, value: string) => `${tag}${String(value.length).padStart(2, "0")}${value}`;
const withCrc = (body: string) => `${body}6304${crc16(`${body}6304`)}`;

/** Mẫu QR tĩnh của thiết kế mục 3: template 26 `VN.FLEXPAY` + mã SQ…, không có số tiền. */
function staticPayload(code: string, shopName: string): string {
  const ascii = shopName.normalize("NFD").replace(/[^\x20-\x7e]/g, "").slice(0, 25) || "FLEXPAY";
  return withCrc(
    tlv("00", "01") + tlv("01", "11") + tlv("26", tlv("00", "VN.FLEXPAY") + tlv("01", code)) +
      tlv("53", "704") + tlv("58", "VN") + tlv("59", ascii) + tlv("60", "HA NOI"),
  );
}

function staticCode(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  return `SQ${Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("")}`;
}

export function fixtureOrderDisplay(order: Order): CustomerDisplay {
  const fee = envNumber("CUSTOMER_DISPLAY_FIXTURE_FEE", 0);
  // Phí > 0 thì giả lập khách chịu phí (SENDER) để thử dòng "Đơn + Phí = Tổng"; 0 thì cửa hàng chịu.
  const feeBearer = fee > 0 ? "SENDER" : "MERCHANT";
  const payableAmount = order.amount + (feeBearer === "SENDER" ? fee : 0);
  const displayToken = `fx-order-${randomUUID()}`;
  state().displays.set(displayToken, { kind: "ORDER", createdAt: Date.now(), orderCode: order.orderCode, amount: payableAmount });
  return {
    kind: "ORDER",
    displayToken,
    tokenExpiresAt: null,
    orderId: order.id,
    orderCode: order.orderCode,
    displayCode: order.orderCode,
    // Đơn thật đã có VietQR VCB; đơn giả không có thì dựng một chuỗi mẫu có CRC.
    qrPayload: order.qrCode || withCrc(tlv("00", "01") + tlv("01", "12") + tlv("54", String(payableAmount)) + tlv("62", tlv("01", order.orderCode))),
    shop: { name: order.subMerchantName || order.merchantName || "Cửa hàng", terminalName: order.terminalName ?? null },
    amount: order.amount,
    fee,
    feeBearer,
    payableAmount,
    expiresAt: order.expiredAt ?? vnLocal(Date.now() + 15 * 60_000),
    staticQrId: null,
    code: null,
  };
}

/** null khi id không phải mã fixture đã tạo (route trả 404 như BE). */
export function fixtureStaticDisplay(staticQrId: string): CustomerDisplay | null {
  const qr = state().staticQrs.get(staticQrId);
  if (!qr || qr.status !== "ACTIVE") return null;
  const displayToken = `fx-static-${randomUUID()}`;
  state().displays.set(displayToken, { kind: "STATIC_QR", createdAt: Date.now(), orderCode: qr.code, amount: null, staticQrId: qr.id });
  return {
    kind: "STATIC_QR",
    displayToken,
    tokenExpiresAt: null,
    staticQrId: qr.id,
    code: qr.code,
    displayCode: qr.code,
    qrPayload: qr.qrPayload,
    shop: { name: qr.subMerchantName || "Cửa hàng", terminalName: qr.terminalName ?? null },
    orderId: null,
    orderCode: null,
    amount: null,
    fee: null,
    feeBearer: null,
    payableAmount: null,
    expiresAt: null,
  };
}

/** null khi token không do fixture cấp (để route trả 404 như BE). */
export function fixtureDisplayStatus(displayToken: string, now = Date.now()): CustomerDisplayStatus | null {
  const entry = state().displays.get(displayToken);
  if (!entry) return null;
  const elapsed = now - entry.createdAt;
  if (entry.kind === "ORDER") {
    const payAfter = envNumber("CUSTOMER_DISPLAY_FIXTURE_PAY_AFTER_MS", 20_000);
    if (elapsed < payAfter) return { status: "WAITING", orderStatus: "ACTIVE", orderCode: entry.orderCode };
    return { status: "PAID", orderStatus: "SUCCESS", paidAt: vnLocal(entry.createdAt + payAfter), paidAmount: entry.amount, paymentMethod: "FLEXPAY_WALLET", orderCode: entry.orderCode };
  }
  // Mã đã tắt/xoay sau khi mở màn: BE trả CANCELLED để màn thôi hiện mã cũ.
  if (entry.staticQrId && state().staticQrs.get(entry.staticQrId)?.status !== "ACTIVE") return { status: "CANCELLED" };
  const cycleStart = entry.createdAt + Math.floor(elapsed / STATIC_CYCLE_MS) * STATIC_CYCLE_MS;
  const sinceCycle = elapsed % STATIC_CYCLE_MS;
  if (sinceCycle < STATIC_PAID_FROM_MS || sinceCycle >= STATIC_PAID_FROM_MS + STATIC_PAID_WINDOW_MS) {
    return { status: "WAITING" };
  }
  const cycle = Math.floor(elapsed / STATIC_CYCLE_MS);
  return {
    status: "PAID",
    orderStatus: "SUCCESS",
    paidAt: vnLocal(cycleStart + STATIC_PAID_FROM_MS),
    paidAmount: 35_000 + (cycle % 5) * 10_000,
    paymentMethod: "FLEXPAY_WALLET",
    orderCode: `SQ-${String(cycle + 1).padStart(4, "0")}`,
  };
}

export function fixtureListStaticQrs(filter: { subMerchantId?: string; terminalId?: string }): StaticQr[] {
  return [...state().staticQrs.values()].filter(
    (qr) =>
      (!filter.subMerchantId || qr.subMerchantId === filter.subMerchantId) &&
      (filter.terminalId === undefined || (qr.terminalId ?? undefined) === filter.terminalId),
  );
}

export const fixtureGetStaticQr = (id: string): StaticQr | null => state().staticQrs.get(id) ?? null;

export function fixtureCreateStaticQr(input: StaticQrCreate & { subMerchantName?: string | null; terminalName?: string | null }): StaticQr {
  // Mỗi phạm vi chỉ một mã ACTIVE: tạo mới thì tắt mã đang chạy của đúng phạm vi đó, như ràng buộc unique của BE.
  for (const qr of state().staticQrs.values()) {
    if (qr.status === "ACTIVE" && qr.subMerchantId === input.subMerchantId && (qr.terminalId ?? undefined) === input.terminalId) {
      state().staticQrs.set(qr.id, { ...qr, status: "DISABLED", effectiveTo: vnLocal(Date.now()), disabledReason: "Thay bằng mã mới" });
    }
  }
  const code = staticCode();
  const shopName = input.subMerchantName || "Cua hang";
  const qr: StaticQr = {
    id: randomUUID(),
    subMerchantId: input.subMerchantId,
    subMerchantName: input.subMerchantName ?? null,
    terminalId: input.terminalId ?? null,
    terminalName: input.terminalName ?? null,
    code,
    qrPayload: staticPayload(code, shopName),
    version: 1,
    status: "ACTIVE",
    effectiveFrom: vnLocal(Date.now()),
    effectiveTo: null,
    disabledReason: null,
    createdAt: vnLocal(Date.now()),
  };
  state().staticQrs.set(qr.id, qr);
  return qr;
}

export function fixtureDisableStaticQr(id: string, reason: string): StaticQr | null {
  const qr = state().staticQrs.get(id);
  if (!qr) return null;
  const next: StaticQr = { ...qr, status: "DISABLED", effectiveTo: vnLocal(Date.now()), disabledReason: reason };
  state().staticQrs.set(id, next);
  return next;
}

/** Xoay mã: tắt bản cũ, sinh bản mới cùng phạm vi với version + 1 (mã cũ in ra giấy thôi dùng được). */
export function fixtureRotateStaticQr(id: string): StaticQr | null {
  const qr = state().staticQrs.get(id);
  if (!qr || qr.status !== "ACTIVE") return null;
  const next = fixtureCreateStaticQr({
    subMerchantId: qr.subMerchantId,
    terminalId: qr.terminalId ?? undefined,
    subMerchantName: qr.subMerchantName,
    terminalName: qr.terminalName,
  });
  const rotated: StaticQr = { ...next, version: (qr.version ?? 1) + 1 };
  state().staticQrs.set(rotated.id, rotated);
  return rotated;
}
