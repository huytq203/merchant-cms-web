import { describe, expect, it } from "vitest";

import { safeCallback } from "@/features/auth/utils/safe-callback";

describe("safeCallback", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeCallback("/orders?page=2")).toBe("/orders?page=2");
  });

  it.each([null, "", "orders", "//evil.com", "https://evil.com", "/\\evil.com", "/\t/evil.com", "/\n/evil.com", "/login", "/api/x", "javascript:alert(1)"])(
    "falls back to the dashboard for %s",
    (value) => {
      expect(safeCallback(value)).toBe("/dashboard");
    },
  );
});
