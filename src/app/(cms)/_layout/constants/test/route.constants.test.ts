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
    expect(visible).not.toContain("Danh sách yêu cầu hoàn tiền");
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
        permissions: ["MANAGE_USER", "VIEW_ORDER", "VIEW_TRANSACTION", "MANAGE_SUB_MERCHANT"],
        hasMerchant: false,
      }),
    );
    expect(visible).not.toContain("Tổng quan");
    expect(visible).not.toContain("Danh sách người dùng");
    expect(visible).not.toContain("Danh sách đơn hàng");
    expect(visible).not.toContain("Danh sách giao dịch");
    expect(visible).not.toContain("Danh sách Sub-merchant");
    expect(visible).not.toContain("Hồ sơ KYB và ĐVCNTT");
  });

  it("keeps items scoped to Subs or the audit log for a session without a Master", () => {
    const visible = titles(
      filterRoutesByAccess(routesConfig, {
        permissions: ["MANAGE_SUB_MERCHANT", "VIEW_AUDIT_LOG"],
        hasMerchant: false,
      }),
    );
    expect(visible).toContain("Danh sách Terminal");
    expect(visible).toContain("Nhật ký hệ thống");
  });
});

describe("findLandingPath", () => {
  it("lands on the dashboard when the session has a Master", () => {
    expect(findLandingPath({ permissions: [], hasMerchant: true })).toBe("/dashboard");
  });

  it("lands on the first page a Sub-only session may open", () => {
    expect(findLandingPath({ permissions: ["MANAGE_SUB_MERCHANT", "VIEW_AUDIT_LOG"], hasMerchant: false })).toBe("/terminals");
    expect(findLandingPath({ permissions: ["VIEW_AUDIT_LOG"], hasMerchant: false })).toBe("/audit-logs");
  });

  it("returns null when nothing is allowed", () => {
    expect(findLandingPath({ permissions: [], hasMerchant: false })).toBeNull();
  });
});
