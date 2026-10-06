import { describe, expect, it } from "vitest";
import { orderResponseSchema, orderFormSchema, orderStatusSchema } from "./order.schema";
import { canRefreshQr, isOrderQrExpired, toExpiredAt, toOrderCreateRequest } from "../utils/order-mapper";

const sample = {
  id: "a1111111-1111-4111-8111-111111111111",
  merchantId: "a2222222-2222-4222-8222-222222222222",
  merchantName: "Cửa hàng",
  merchantCode: "M01",
  subMerchantId: "a3333333-3333-4333-8333-333333333333",
  terminalId: null,
  orderCode: "O01",
  orderDescription: null,
  netAmount: 1000,
  amount: 1000,
  currency: "VND",
  status: "ACTIVE",
  bankCode: "VCB",
  expiredAt: null,
  createdAt: "2026-10-05T10:00:00",
  updatedAt: null,
  virtualAccount: null,
  qrCode: "qr",
  qrCodeImage: null,
  transactionCode: null,
  feeAmount: null,
};

describe("order contract", () => {
  it("parses every field of the merchant portal order", () => {
    expect(orderResponseSchema.parse(sample)).toMatchObject(sample);
  });

  it("does not expose accounting fields even if BE sends them", () => {
    const parsed = orderResponseSchema.parse({ ...sample, journalId: "a4444444-4444-4444-8444-444444444444", creditFailureReason: "x" });
    expect(parsed).not.toHaveProperty("journalId");
    expect(parsed).not.toHaveProperty("creditFailureReason");
  });

  it("rejects an unknown status", () => {
    expect(orderResponseSchema.safeParse({ ...sample, status: "PAID" }).success).toBe(false);
  });

  it("allows QR refresh only while the order awaits payment", () => {
    expect(canRefreshQr("ACTIVE")).toBe(true);
    for (const status of orderStatusSchema.options.filter((value) => value !== "ACTIVE")) {
      expect(canRefreshQr(status)).toBe(false);
    }
  });

  it("treats an ACTIVE order past its expiry as having an expired QR", () => {
    const now = new Date("2026-10-05T04:00:00Z");
    // 04:00Z is 11:00 in business time (UTC+7).
    expect(isOrderQrExpired({ status: "ACTIVE", expiredAt: "2026-10-05T12:00:00" }, now)).toBe(false);
    expect(isOrderQrExpired({ status: "ACTIVE", expiredAt: "2026-10-05T10:59:59" }, now)).toBe(true);
    expect(isOrderQrExpired({ status: "ACTIVE", expiredAt: null }, now)).toBe(false);
    expect(isOrderQrExpired({ status: "SUCCESS", expiredAt: "2020-01-01T00:00:00" }, now)).toBe(false);
  });

  it("rejects non-positive, fractional and malformed amounts", () => {
    for (const amount of [0, -5, 10.5, "abc", ""]) {
      expect(orderFormSchema.safeParse({ orderCode: "O", amount, bankCode: "VCB" }).success).toBe(false);
    }
    expect(orderFormSchema.safeParse({ orderCode: "O", amount: "1500000", bankCode: "VCB" }).success).toBe(true);
  });

  it("omits empty optional strings from the create request", () => {
    const form = orderFormSchema.parse({ orderCode: "O", amount: 1000, bankCode: "VCB", orderDescription: " " });
    expect(toOrderCreateRequest(form, sample.merchantId)).toEqual({
      merchantId: sample.merchantId,
      orderCode: "O",
      amount: 1000,
      bankCode: "VCB",
      currency: "VND",
      paymentMethod: "QR",
    });
  });

  it("converts an expiry choice into a business-time expiredAt", () => {
    const now = new Date("2026-10-05T04:00:00Z");
    const form = orderFormSchema.parse({ orderCode: "O", amount: 1000, bankCode: "VCB", expiryMinutes: "60" });
    expect(toOrderCreateRequest(form, sample.merchantId, now)).toMatchObject({ expiredAt: "2026-10-05T12:00:00" });
    expect(toExpiredAt(0, now)).toBeUndefined();
  });
});
