import { describe, expect, it } from "vitest";
import { hasSameIds, canLockUser, canUnlockUser, toCreateUserRequest, toUpdateUserRequest } from "../user-mapper";

const values = { email: "user@example.com", fullName: "Test User", phone: "0912345678", groupIds: ["group-1"], merchantIds: [], subMerchantIds: [] };

describe("user mapper", () => {
  it("creates a request with the selected merchant", () => {
    expect(toCreateUserRequest(values, "merchant-1").merchantIds).toEqual(["merchant-1"]);
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
});
