import { describe, expect, it } from "vitest";
import { formatCountdown, isOrderQrExpired, parseExpiredAt, toOrderCreateRequest } from "../order-mapper";
import { generateOrderCode } from "../order-code";

const merchantId = "22222222-2222-4222-8222-222222222222";

describe("expiry", () => {
  it("reads a zone-less expiry as business time (UTC+7)", () => {
    expect(parseExpiredAt("2026-10-09T14:00:00")?.toISOString()).toBe("2026-10-09T07:00:00.000Z");
    expect(parseExpiredAt("2026-10-09T07:00:00Z")?.toISOString()).toBe("2026-10-09T07:00:00.000Z");
  });

  it("treats a missing or unreadable expiry as no expiry", () => {
    expect(parseExpiredAt(null)).toBeNull();
    expect(parseExpiredAt("not a date")).toBeNull();
    expect(isOrderQrExpired({ status: "ACTIVE", expiredAt: null }, new Date())).toBe(false);
  });

  it("expires only unpaid orders", () => {
    const past = "2000-01-01T00:00:00";
    expect(isOrderQrExpired({ status: "ACTIVE", expiredAt: past }, new Date())).toBe(true);
    expect(isOrderQrExpired({ status: "SUCCESS", expiredAt: past }, new Date())).toBe(false);
  });
});

describe("countdown", () => {
  const now = new Date("2026-10-09T07:00:00Z");

  it("counts down in hours, minutes and seconds, past 24 hours too", () => {
    expect(formatCountdown("2026-10-09T14:00:41", now)).toBe("00:00:41");
    expect(formatCountdown("2026-10-10T17:30:05", now)).toBe("27:30:05");
  });

  it("stops at zero and is absent without an expiry", () => {
    expect(formatCountdown("2026-10-09T13:00:00", now)).toBe("00:00:00");
    expect(formatCountdown(null, now)).toBeNull();
  });
});

describe("order code", () => {
  it("builds a dated code with four random digits", () => {
    expect(generateOrderCode(new Date(2026, 9, 9), () => 0)).toBe("DH261009-1000");
    expect(generateOrderCode(new Date(2026, 9, 9), () => 0.9999)).toBe("DH261009-9999");
  });
});

describe("create request", () => {
  it("sends the Terminal only when one was chosen", () => {
    const values = { orderCode: "A", amount: 1000, currency: "VND", bankCode: "VCB", paymentMethod: "QR" } as const;
    expect(toOrderCreateRequest(values, merchantId)).not.toHaveProperty("terminalId");
    const terminalId = "55555555-5555-4555-8555-555555555555";
    expect(toOrderCreateRequest({ ...values, terminalId }, merchantId)).toMatchObject({ terminalId });
  });
});
