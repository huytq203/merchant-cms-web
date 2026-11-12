import { describe, expect, it } from "vitest";
import {
  classifyStatus,
  flexieIndex,
  formatRemaining,
  hasCustomerFee,
  isNewStaticPayment,
} from "../display-state";

describe("classifyStatus", () => {
  it.each(["PAYMENT_CONFIRMED", "CREDIT_PENDING", "CREDIT_POSTING", "SUCCESS", "PAID"])("treats %s as paid", (status) => {
    expect(classifyStatus(status)).toBe("paid");
  });

  it.each(["EXPIRED", "CANCELLED", "FAILED"])("treats %s as closed", (status) => {
    expect(classifyStatus(status)).toBe("closed");
  });

  it.each(["ACTIVE", "PENDING", "WAITING", "SOMETHING_NEW"])("keeps showing the QR for %s", (status) => {
    expect(classifyStatus(status)).toBe("waiting");
  });
});

describe("flexieIndex", () => {
  it("is stable for the same order code so a reload shows the same Flexie", () => {
    expect(flexieIndex("DH-240518", 6)).toBe(flexieIndex("DH-240518", 6));
  });

  it("always lands inside the pose list", () => {
    for (const seed of ["", "a", "DH-1", "DH-2", "SQAB12CD34EF", "x".repeat(200)]) {
      const index = flexieIndex(seed, 6);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(6);
    }
  });

  it("spreads different orders over more than one pose", () => {
    const picks = new Set(Array.from({ length: 40 }, (_, n) => flexieIndex(`DH-${n}`, 6)));
    expect(picks.size).toBeGreaterThan(1);
  });
});

describe("hasCustomerFee", () => {
  it("is true only when the customer (SENDER) bears a positive fee", () => {
    expect(hasCustomerFee({ fee: 2200, feeBearer: "SENDER" })).toBe(true);
    expect(hasCustomerFee({ fee: 2200, feeBearer: "MERCHANT" })).toBe(false);
    expect(hasCustomerFee({ fee: 2200, feeBearer: null })).toBe(false);
    expect(hasCustomerFee({ fee: 0, feeBearer: "SENDER" })).toBe(false);
  });
});

describe("isNewStaticPayment", () => {
  const paid = { status: "PAID", paidAt: "2026-11-12T10:00:00" };

  it("fires once for a payment not seen before", () => {
    expect(isNewStaticPayment(paid, null)).toBe(true);
    expect(isNewStaticPayment(paid, "2026-11-12T10:00:00")).toBe(false);
  });

  it("ignores a waiting status or a paid status without time", () => {
    expect(isNewStaticPayment({ status: "WAITING", paidAt: null }, null)).toBe(false);
    expect(isNewStaticPayment({ status: "PAID", paidAt: null }, null)).toBe(false);
  });

  it("fires again for the next payment", () => {
    expect(isNewStaticPayment({ status: "PAID", paidAt: "2026-11-12T10:00:30" }, "2026-11-12T10:00:00")).toBe(true);
  });
});

describe("formatRemaining", () => {
  const now = new Date("2026-11-12T10:00:00+07:00");

  it("shows minutes and seconds left", () => {
    expect(formatRemaining("2026-11-12T10:14:05+07:00", now)).toBe("14:05");
  });

  it("stops at 00:00 once expired", () => {
    expect(formatRemaining("2026-11-12T09:59:00+07:00", now)).toBe("00:00");
  });

  it("reads a BE time without offset as Vietnam time", () => {
    expect(formatRemaining("2026-11-12T10:01:00", now)).toBe("01:00");
  });

  it("returns null without a usable expiry", () => {
    expect(formatRemaining(null, now)).toBeNull();
    expect(formatRemaining("not a date", now)).toBeNull();
  });
});
