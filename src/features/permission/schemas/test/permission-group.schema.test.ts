import { describe, expect, it } from "vitest";
import { permissionCatalogSchema, permissionGroupFormSchema, permissionGroupSchema } from "../permission-group.schema";

const group = {
  id: "11111111-1111-4111-8111-111111111111",
  merchantId: null,
  name: "Xem đơn hàng",
  permissions: ["VIEW_ORDER"],
  createdAt: "2026-10-05T10:00:00",
};

describe("permission group schemas", () => {
  it("parses the merchant portal response without admin-only fields", () => {
    const response = {
      id: group.id,
      merchantId: null,
      name: "Nhóm hệ thống",
      permissions: ["VIEW_ORDER"],
      system: true,
      createdAt: group.createdAt,
    };

    expect(permissionGroupSchema.parse(response)).toMatchObject({
      merchantId: null,
      name: "Nhóm hệ thống",
      system: true,
    });
  });

  it("parses a group and defaults omitted system to false", () => {
    expect(permissionGroupSchema.parse(group)).toMatchObject({ system: false, name: "Xem đơn hàng" });
    expect(permissionGroupSchema.parse({ ...group, system: true }).system).toBe(true);
  });

  it("rejects lowercase codes and empty permissions", () => {
    const values = { code: "GROUP_1", name: "Nhóm", description: "", permissions: ["VIEW_ORDER"] };
    expect(permissionGroupFormSchema.safeParse({ ...values, code: "group_1" }).success).toBe(false);
    expect(permissionGroupFormSchema.safeParse({ ...values, permissions: [] }).success).toBe(false);
  });

  it("accepts a new BE permission code", () => {
    expect(permissionCatalogSchema.parse([{ code: "NEW_BE_PERMISSION", category: "ORDER" }])).toHaveLength(1);
  });
});
