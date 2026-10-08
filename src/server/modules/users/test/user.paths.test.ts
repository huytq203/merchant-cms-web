import { describe, expect, it } from "vitest";
import { userPaths } from "../user.paths";

describe("merchant-user portal paths", () => {
  it("uses the merchant portal actions, including resend activation", () => {
    expect(userPaths.list).toBe("/api/v1/merchant/merchant-users");
    expect(userPaths.assignGroups("user id")).toBe(
      "/api/v1/merchant/merchant-users/user%20id/assign-groups",
    );
    expect(userPaths.scopeProposal("user id")).toBe(
      "/api/v1/merchant/merchant-users/user%20id/scope-proposal",
    );
    expect(userPaths.resendActivation("user id")).toBe(
      "/api/v1/merchant/merchant-users/user%20id/resend-activation",
    );
  });
});
