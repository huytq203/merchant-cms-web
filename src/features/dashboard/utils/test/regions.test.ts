import { describe, expect, it } from "vitest";

import { visibleRegions } from "../regions";

describe("visibleRegions", () => {
  it("shows a region only when its permission is granted", () => {
    expect(visibleRegions(["VIEW_ORDER"])).toMatchObject({ orders: true, withdrawals: false, terminals: false });
    expect(visibleRegions(["VIEW_WITHDRAWAL", "VIEW_TERMINAL"])).toMatchObject({ orders: false, withdrawals: true, terminals: true });
  });

  it("counts the stat cards: three for orders, one for terminals", () => {
    expect(visibleRegions(["VIEW_ORDER", "MANAGE_TERMINAL"]).statCards).toBe(4);
    expect(visibleRegions(["VIEW_ORDER"]).statCards).toBe(3);
    expect(visibleRegions(["VIEW_TERMINAL"]).statCards).toBe(1);
    expect(visibleRegions(["MANAGE_SUB_MERCHANT"]).statCards).toBe(0);
    expect(visibleRegions([]).statCards).toBe(0);
  });

  it("reports nothing visible without any of the permissions", () => {
    expect(visibleRegions(["MANAGE_USER"]).any).toBe(false);
    expect(visibleRegions(["VIEW_ORDER"]).any).toBe(true);
  });
});
