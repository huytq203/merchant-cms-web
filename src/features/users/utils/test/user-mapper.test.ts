import { describe, expect, it } from "vitest";
import { hasSameIds, canLockUser, canUnlockUser, merchantOptionLabel, merchantScopeLabel, merchantScopeNames, toCreateUserRequest, toUpdateUserRequest } from "../user-mapper";

const values = { email: "user@example.com", fullName: "Test User", phone: "0912345678", groupIds: ["group-1"], merchantIds: [], subMerchantIds: [] };

describe("user mapper", () => {
  it("creates a request with the selected merchant", () => {
    expect(toCreateUserRequest(values, "merchant-1").merchantIds).toEqual(["merchant-1"]);
    // Người quản lý cấp Sub không có Master riêng: không gửi Master rỗng, BE suy Master từ Sub đã chọn.
    expect(toCreateUserRequest(values, undefined).merchantIds).toEqual([]);
  });

  it("excludes email and assignments from update", () => {
    expect(toUpdateUserRequest(values)).toEqual({ fullName: "Test User", phone: "0912345678" });
  });

  it("accepts only editable profile fields for an update", () => {
    expect(toUpdateUserRequest({ fullName: "Updated User", phone: "0912345678" })).toEqual({
      fullName: "Updated User",
      phone: "0912345678",
    });
  });

  it("prevents self lock and locks only active users", () => {
    expect(canLockUser({ id: "actor", active: true, locked: false }, "actor")).toBe(false);
    expect(canLockUser({ id: "other", active: false, locked: false }, "actor")).toBe(false);
    expect(canLockUser({ id: "other", active: true, locked: false }, "actor")).toBe(true);
  });

  it("unlocks only locked users", () => {
    expect(canUnlockUser({ active: false, locked: true })).toBe(true);
    expect(canUnlockUser({ active: true, locked: false })).toBe(false);
  });

  it("compares id lists regardless of order", () => {
    expect(hasSameIds(["a", "b"], ["b", "a"])).toBe(true);
    expect(hasSameIds(["a"], ["a", "b"])).toBe(false);
    expect(hasSameIds(undefined, [])).toBe(true);
  });

  describe("merchantScopeLabel", () => {
    it("says none when the user has no merchant", () => {
      expect(merchantScopeLabel([])).toBe("Chưa có");
    });

    it("counts the merchants of the user instead of using a vague phrase", () => {
      expect(merchantScopeLabel(["m-1"])).toBe("1 merchant");
    });

    it("counts merchants instead of numbering them when the session has several", () => {
      expect(merchantScopeLabel(["m-1", "m-4", "m-3", "m-2"])).toBe("4 merchant");
      expect(merchantScopeLabel(["m-2"])).toBe("1 merchant");
    });
  });

  describe("merchantOptionLabel", () => {
    const merchants = [
      { id: "m-1", code: "MC000001", name: "Halo tech" },
      { id: "m-2", code: null, name: "Green mart" },
    ];

    it("shows the code and name of a merchant", () => {
      expect(merchantOptionLabel(merchants, ["m-1", "m-2"], "m-1")).toBe("MC000001 · Halo tech");
    });

    it("shows just the name when the merchant has no code", () => {
      expect(merchantOptionLabel(merchants, ["m-1", "m-2"], "m-2")).toBe("Green mart");
    });

    it("falls back to the position label when the BE sent no name", () => {
      expect(merchantOptionLabel([], ["m-1", "m-2"], "m-2")).toBe("Merchant 2");
    });
  });

  describe("merchantScopeNames", () => {
    const merchants = [
      { id: "m-1", code: "MC000001", name: "Halo tech" },
      { id: "m-2", code: "MC000002", name: "Green mart" },
    ];

    it("names every merchant of the user, in the user's order", () => {
      expect(merchantScopeNames(["m-2", "m-1"], merchants)).toEqual(["MC000002 · Green mart", "MC000001 · Halo tech"]);
    });

    it("gives no names when one merchant is unknown, so the caller falls back to a count", () => {
      expect(merchantScopeNames(["m-1", "m-9"], merchants)).toBeNull();
      expect(merchantScopeNames(["m-1"], [])).toBeNull();
    });

    it("gives no names for a user without merchants", () => {
      expect(merchantScopeNames([], merchants)).toBeNull();
    });
  });
});
