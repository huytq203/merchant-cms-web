import { describe, expect, it } from "vitest";

import { filterRoutesByAccess, findLandingPath, routesConfig } from "@/app/(cms)/_layout/constants/route.constants";

const titles = (sections: ReturnType<typeof filterRoutesByAccess>) =>
  sections.flatMap((section) => section.items.map((item) => item.title));

describe("filterRoutesByAccess", () => {
  it("always keeps items that need no permission", () => {
    const visible = filterRoutesByAccess(routesConfig, { permissions: [], hasMerchant: true });
    expect(titles(visible)).toEqual(["Tổng quan"]);
  });

  it("shows an item only when its permission is granted", () => {
    const visible = titles(
      filterRoutesByAccess(routesConfig, {
        permissions: ["MANAGE_USER", "VIEW_ORDER"],
        hasMerchant: true,
      }),
    );
    expect(visible).toContain("Danh sách người dùng");
    expect(visible).toContain("Danh sách đơn hàng");
    expect(visible).not.toContain("Hoàn tiền");
    expect(visible).not.toContain("Danh sách nhóm quyền");
  });

  it("removes sections that end up empty", () => {
    const sections = filterRoutesByAccess(routesConfig, { permissions: [], hasMerchant: true });
    expect(sections.every((section) => section.items.length > 0)).toBe(true);
    expect(sections).toHaveLength(1);
  });

  it("hides items that need a Master when the session has none, even with the permission", () => {
    const visible = titles(
      filterRoutesByAccess(routesConfig, {
        permissions: ["MANAGE_USER", "VIEW_ORDER", "VIEW_TRANSACTION", "MANAGE_SUB_MERCHANT", "VIEW_BANK_ACCOUNT"],
        hasMerchant: false,
      }),
    );
    expect(visible).not.toContain("Tổng quan");
    expect(visible).not.toContain("Danh sách người dùng");
    expect(visible).not.toContain("Danh sách đơn hàng");
    expect(visible).not.toContain("Danh sách giao dịch");
    expect(visible).not.toContain("Danh sách Sub-merchant");
    expect(visible).not.toContain("Hồ sơ KYB và ĐVCNTT");
    expect(visible).not.toContain("Danh sách tài khoản ngân hàng");
  });

  it("no longer has the transaction list screen, even for a session with VIEW_TRANSACTION", () => {
    const visible = titles(
      filterRoutesByAccess(routesConfig, { permissions: ["VIEW_TRANSACTION", "VIEW_ORDER"], hasMerchant: true }),
    );
    expect(visible).toContain("Danh sách đơn hàng");
    expect(visible).not.toContain("Danh sách giao dịch");
    expect(JSON.stringify(routesConfig.flatMap((section) => section.items.map((item) => item.href)))).not.toContain("/transaction");
  });

  it("gates Terminal and bank accounts by their own read permissions, not by MANAGE_SUB_MERCHANT", () => {
    const subOnly = titles(filterRoutesByAccess(routesConfig, { permissions: ["MANAGE_SUB_MERCHANT"], hasMerchant: true }));
    expect(subOnly).toContain("Danh sách Sub-merchant");
    expect(subOnly).not.toContain("Danh sách Terminal");
    expect(subOnly).not.toContain("Danh sách tài khoản ngân hàng");
    const readers = titles(filterRoutesByAccess(routesConfig, { permissions: ["VIEW_TERMINAL", "CREATE_WITHDRAWAL"], hasMerchant: true }));
    expect(readers).toContain("Danh sách Terminal");
    expect(readers).toContain("Danh sách tài khoản ngân hàng");
    expect(titles(filterRoutesByAccess(routesConfig, { permissions: ["MANAGE_TERMINAL", "MANAGE_BANK_ACCOUNT"], hasMerchant: true }))).toEqual(
      expect.arrayContaining(["Danh sách Terminal", "Danh sách tài khoản ngân hàng"]),
    );
  });

  it("keeps items scoped to Subs or the audit log for a session without a Master", () => {
    const visible = titles(
      filterRoutesByAccess(routesConfig, {
        permissions: ["VIEW_TERMINAL", "VIEW_AUDIT_LOG"],
        hasMerchant: false,
      }),
    );
    expect(visible).toContain("Danh sách Terminal");
    expect(visible).toContain("Nhật ký hệ thống");
  });
});

describe("màn Hoàn tiền (gộp /refund vào /revenue-refunds)", () => {
  it("chỉ còn một mục Hoàn tiền, trỏ /revenue-refunds, nằm cùng nhóm với đơn hàng", () => {
    const items = routesConfig.flatMap((section) => section.items);
    expect(items.filter((item) => item.href === "/revenue-refunds")).toHaveLength(1);
    expect(items.map((item) => item.href)).not.toContain("/refund");
    const section = routesConfig.find((candidate) => candidate.items.some((item) => item.href === "/revenue-refunds"));
    expect(section?.items.map((item) => item.title)).toEqual(expect.arrayContaining(["Danh sách đơn hàng", "Hoàn tiền"]));
    expect(titles(filterRoutesByAccess(routesConfig, { permissions: ["VIEW_REFUND"], hasMerchant: true }))).toContain("Hoàn tiền");
  });
});

describe("findLandingPath", () => {
  it("lands on the dashboard when the session has a Master", () => {
    expect(findLandingPath({ permissions: [], hasMerchant: true })).toBe("/dashboard");
  });

  it("lands on the first page a Sub-only session may open", () => {
    expect(findLandingPath({ permissions: ["VIEW_TERMINAL", "VIEW_AUDIT_LOG"], hasMerchant: false })).toBe("/terminals");
    expect(findLandingPath({ permissions: ["VIEW_AUDIT_LOG"], hasMerchant: false })).toBe("/audit-logs");
  });

  it("returns null when nothing is allowed", () => {
    expect(findLandingPath({ permissions: [], hasMerchant: false })).toBeNull();
  });
});
