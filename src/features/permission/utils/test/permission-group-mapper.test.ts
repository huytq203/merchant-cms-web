import { describe, expect, it } from "vitest";
import { canEditGroup, groupPermissionsByCategory, toGroupRequest } from "../permission-group-mapper";

const values = { code: "GROUP_1", name: "Nhóm", description: "", permissions: ["VIEW_ORDER"] };

describe("permission group mapper", () => {
  it("keeps category order and puts unknown category into Khác", () => {
    const result = groupPermissionsByCategory([
      { code: "A", category: "ORDER" },
      { code: "B", category: "FUTURE" },
      { code: "C", category: "TRANSACTION" },
    ]);
    expect(result.map((group) => group.label)).toEqual(["Đơn hàng", "Khác", "Giao dịch"]);
  });

  it("adds merchant ownership to create request", () => {
    expect(toGroupRequest(values, "merchant-1")).toEqual({ ...values, description: undefined, merchantId: "merchant-1" });
  });

  it("disallows editing a system group", () => {
    expect(canEditGroup({ system: true })).toBe(false);
    expect(canEditGroup({ system: false })).toBe(true);
  });
});
