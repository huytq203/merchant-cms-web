import { describe, expect, it } from "vitest";
import { canEditGroup, groupPermissionsByCategory, toGroupRequest } from "../permission-group-mapper";

const values = { code: "GROUP_1", name: "Nhóm", description: "", permissions: ["VIEW_ORDER"], scopeLevel: "MASTER" as const };

describe("permission group mapper", () => {
  it("keeps category order and puts unknown category into Khác", () => {
    const result = groupPermissionsByCategory([
      { code: "A", category: "ORDER" },
      { code: "B", category: "FUTURE" },
      { code: "C", category: "TRANSACTION" },
    ]);
    expect(result.map((group) => group.label)).toEqual(["Đơn hàng", "Khác", "Giao dịch"]);
  });

  it("labels the five categories added with the 48-permission catalogue instead of lumping them into Khác", () => {
    const result = groupPermissionsByCategory(
      ["APPROVAL", "SUB_MERCHANT_TERMINAL", "CONNECTION_PAYMENT", "FINANCIAL_TERMS", "ESCROW_HOLD"].map((category) => ({ code: category, category })),
    );
    expect(result.map((group) => group.label)).toEqual([
      "Phê duyệt",
      "Điểm bán và Terminal",
      "Kết nối và thanh toán",
      "Điều khoản tài chính",
      "Ký quỹ và tạm giữ",
    ]);
  });

  it("adds merchant ownership to create request", () => {
    expect(toGroupRequest(values, "merchant-1")).toEqual({ ...values, description: undefined, merchantId: "merchant-1" });
  });

  it("disallows editing a system group", () => {
    expect(canEditGroup({ system: true })).toBe(false);
    expect(canEditGroup({ system: false })).toBe(true);
  });
});
