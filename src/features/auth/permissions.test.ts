import { describe, expect, it } from "vitest";

import {
  MERCHANT_PERMISSIONS,
  hasAnyPermission,
  hasPermission,
  isMerchantPermission,
} from "@/features/auth/permissions";

describe("merchant permissions", () => {
  it("lists the 27 permissions the BE defines", () => {
    expect(MERCHANT_PERMISSIONS).toHaveLength(27);
    expect(new Set(MERCHANT_PERMISSIONS).size).toBe(27);
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
