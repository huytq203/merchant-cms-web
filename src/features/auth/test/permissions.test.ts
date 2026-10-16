import { describe, expect, it } from "vitest";

import {
  MERCHANT_PERMISSIONS,
  hasAnyPermission,
  hasPermission,
  isMerchantPermission,
} from "@/features/auth/permissions";

describe("merchant permissions", () => {
  it("lists the 48 permissions the BE defines", () => {
    expect(MERCHANT_PERMISSIONS).toHaveLength(48);
    expect(new Set(MERCHANT_PERMISSIONS).size).toBe(48);
  });

  it("knows the permissions added with the portal catalogue", () => {
    for (const code of ["VIEW_TERMINAL", "MANAGE_TERMINAL", "LOCK_SUB_MERCHANT", "VIEW_BANK_ACCOUNT", "MANAGE_BANK_ACCOUNT", "APPROVE_USER_SCOPE", "VIEW_ESCROW", "VIEW_HOLD"]) {
      expect(isMerchantPermission(code)).toBe(true);
    }
  });

  it("recognises known names and rejects unknown ones", () => {
    expect(isMerchantPermission("VIEW_AUDIT_LOG")).toBe(true);
    expect(isMerchantPermission("FUTURE_PERMISSION")).toBe(false);
  });

  it("checks single and any-of permissions", () => {
    const granted = ["VIEW_ORDER", "MANAGE_USER"] as const;
    expect(hasPermission(granted, "MANAGE_USER")).toBe(true);
    expect(hasPermission(granted, "VIEW_REFUND")).toBe(false);
    expect(hasAnyPermission(granted, ["VIEW_REFUND", "VIEW_ORDER"])).toBe(true);
    expect(hasAnyPermission([], ["VIEW_ORDER"])).toBe(false);
  });
});
