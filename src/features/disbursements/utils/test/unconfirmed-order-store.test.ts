// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearUnconfirmedOrder,
  clearUnconfirmedOrdersOfUser,
  loadUnconfirmedOrder,
  saveUnconfirmedOrder,
  unconfirmedOrderKey,
  type StoredUnconfirmedOrder,
} from "../unconfirmed-order-store";

const order: StoredUnconfirmedOrder = {
  values: { merchantRequestCode: "MA-01", bankCode: "VCB", accountNumber: "0123456789", accountName: "", amount: "1000000", description: "Tien thue" },
  inquiry: { status: "VERIFIED", bankAccountName: "NGUYEN VAN A" },
  mismatchAccepted: false,
  savedAt: 1_700_000_000_000,
};

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("unconfirmed order store", () => {
  it("keys by user and Sub so one account never sees another's pending order", () => {
    expect(unconfirmedOrderKey("u1", "s1")).not.toBe(unconfirmedOrderKey("u2", "s1"));
    expect(unconfirmedOrderKey("u1", "s1")).not.toBe(unconfirmedOrderKey("u1", "s2"));
  });

  it("round-trips the order, and never writes anything resembling an OTP", () => {
    const key = unconfirmedOrderKey("u1", "s1");
    saveUnconfirmedOrder(key, order);
    expect(loadUnconfirmedOrder(key)).toEqual(order);
    expect(JSON.stringify(Object.values(localStorage))).not.toMatch(/otp/i);
    clearUnconfirmedOrder(key);
    expect(loadUnconfirmedOrder(key)).toBeNull();
  });

  it("ignores a corrupted or foreign value", () => {
    const key = unconfirmedOrderKey("u1", "s1");
    localStorage.setItem(key, "{not json");
    expect(loadUnconfirmedOrder(key)).toBeNull();
    localStorage.setItem(key, JSON.stringify({ values: { merchantRequestCode: 5 } }));
    expect(loadUnconfirmedOrder(key)).toBeNull();
  });

  it("clears every pending order of one user (all Subs) and leaves other users and other keys alone", () => {
    saveUnconfirmedOrder(unconfirmedOrderKey("u1", "s1"), order);
    saveUnconfirmedOrder(unconfirmedOrderKey("u1", "s2"), order);
    saveUnconfirmedOrder(unconfirmedOrderKey("u2", "s1"), order);
    localStorage.setItem("unrelated", "x");
    clearUnconfirmedOrdersOfUser("u1");
    expect(loadUnconfirmedOrder(unconfirmedOrderKey("u1", "s1"))).toBeNull();
    expect(loadUnconfirmedOrder(unconfirmedOrderKey("u1", "s2"))).toBeNull();
    expect(loadUnconfirmedOrder(unconfirmedOrderKey("u2", "s1"))).not.toBeNull();
    expect(localStorage.getItem("unrelated")).toBe("x");
  });

  it("does not throw when the storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("denied"); });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new Error("denied"); });
    const key = unconfirmedOrderKey("u1", "s1");
    expect(() => saveUnconfirmedOrder(key, order)).not.toThrow();
    expect(loadUnconfirmedOrder(key)).toBeNull();
    expect(() => clearUnconfirmedOrder(key)).not.toThrow();
  });
});
