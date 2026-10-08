import { describe, expect, it } from "vitest";
import { permissionGroupPaths } from "../permission-group.paths";

describe("merchant permission-group paths", () => {
  it("uses only the merchant portal contract, including direct user assignment", () => {
    expect(permissionGroupPaths.catalog).toBe("/api/v1/merchant/merchant-permissions");
    expect(permissionGroupPaths.list).toBe("/api/v1/merchant/permission-groups");
    expect(permissionGroupPaths.assignUsers("group id")).toBe(
      "/api/v1/merchant/permission-groups/group%20id/assign-users",
    );
  });
});
