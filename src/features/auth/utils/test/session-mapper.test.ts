import { describe, expect, it } from "vitest";

import { meResponseSchema } from "@/features/auth/schemas";
import { toSessionUser } from "@/features/auth/utils/session-mapper";

const base = {
  merchantUserId: "u-1",
  email: "an@shop.vn",
  fullName: "Nguyễn An",
  status: "ACTIVE",
  merchantIds: ["m-1"],
  subMerchantIds: ["s-1", "s-2"],
  permissions: ["VIEW_ORDER", "MANAGE_USER"],
  authorizationVersion: 7,
};

describe("toSessionUser", () => {
  it("maps the /me payload to a session user", () => {
    const session = toSessionUser(meResponseSchema.parse(base));
    expect(session).toMatchObject({
      userId: "u-1",
      username: "Nguyễn An",
      fullName: "Nguyễn An",
      email: "an@shop.vn",
      status: "ACTIVE",
      merchantIds: ["m-1"],
      subMerchantIds: ["s-1", "s-2"],
      permissions: ["VIEW_ORDER", "MANAGE_USER"],
      authorizationVersion: 7,
    });
  });

  it("gives a Sub-only session no Master, so it never reaches a Master it does not own", () => {
    const session = toSessionUser(
      meResponseSchema.parse({ ...base, merchantIds: [], parentMerchantIds: ["m-9"] }),
    );
    expect(session.merchantIds).toEqual([]);
    expect(session.subMerchantIds).toEqual(["s-1", "s-2"]);
  });

  it("keeps the session's own Masters when it has them", () => {
    const session = toSessionUser(meResponseSchema.parse({ ...base, parentMerchantIds: ["m-9"] }));
    expect(session.merchantIds).toEqual(["m-1"]);
  });

  it("carries the code and name of each Master so screens can show a name instead of an id", () => {
    const merchants = [{ id: "m-1", code: "MC000001", name: "Halo tech" }];
    const session = toSessionUser(meResponseSchema.parse({ ...base, merchants }));
    expect(session.merchants).toEqual(merchants);
  });

  it("has no Master names when the BE sends none", () => {
    expect(toSessionUser(meResponseSchema.parse(base)).merchants).toEqual([]);
  });

  it("drops permission names the frontend does not know", () => {
    const session = toSessionUser(
      meResponseSchema.parse({ ...base, permissions: ["VIEW_ORDER", "FUTURE_PERMISSION"] }),
    );
    expect(session.permissions).toEqual(["VIEW_ORDER"]);
  });

  it("treats an unknown status as LOCKED", () => {
    const session = toSessionUser(meResponseSchema.parse({ ...base, status: "SUSPENDED" }));
    expect(session.status).toBe("LOCKED");
  });

  it("falls back to the email, then the id, for the display name", () => {
    expect(
      toSessionUser(meResponseSchema.parse({ ...base, fullName: "  " })).username,
    ).toBe("an@shop.vn");
    expect(
      toSessionUser(meResponseSchema.parse({ ...base, fullName: null, email: null })).username,
    ).toBe("u-1");
  });
});
