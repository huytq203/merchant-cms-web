import { describe, expect, it } from "vitest";

import { filterRoutesByPermissions, routesConfig } from "@/app/(cms)/_layout/constants/route.constants";

const titles = (sections: ReturnType<typeof filterRoutesByPermissions>) =>
  sections.flatMap((section) => section.items.map((item) => item.title));

describe("filterRoutesByPermissions", () => {
  it("always keeps items that need no permission", () => {
    expect(titles(filterRoutesByPermissions(routesConfig, []))).toEqual(["Tổng quan"]);
  });

  it("shows an item only when its permission is granted", () => {
    const visible = titles(filterRoutesByPermissions(routesConfig, ["MANAGE_USER", "VIEW_ORDER"]));
    expect(visible).toContain("Danh sách người dùng");
    expect(visible).toContain("Danh sách đơn hàng");
    expect(visible).not.toContain("Danh sách yêu cầu hoàn tiền");
    expect(visible).not.toContain("Danh sách nhóm quyền");
  });

  it("removes sections that end up empty", () => {
    const sections = filterRoutesByPermissions(routesConfig, []);
    expect(sections.every((section) => section.items.length > 0)).toBe(true);
    expect(sections).toHaveLength(1);
  });
});
