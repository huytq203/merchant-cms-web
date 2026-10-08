import { describe, expect, it } from "vitest";
import { merchantUserSchema, scopeProposalSchema, userFormSchema } from "../user.schema";

const user = {
  id: "b4a0f34c-1102-4dc0-84ab-f4c71afbbd4e",
  email: "user@example.com",
  keycloakUserId: "keycloak-user",
  phone: null,
  active: true,
  locked: false,
  groups: [],
  merchantIds: [],
  subMerchantIds: [],
  createdAt: "2026-10-05T10:00:00",
  rolesText: "",
};

describe("merchantUserSchema", () => {
  it("parses the masked merchant portal user response", () => {
    const response = {
      id: user.id,
      keycloakUserId: "keycloak-user",
      email: user.email,
      phone: null,
      active: true,
      locked: false,
      groups: [],
      merchantIds: [],
      subMerchantIds: [],
      rolesText: "Vận hành",
      createdAt: user.createdAt,
    };

    expect(merchantUserSchema.parse(response)).toMatchObject({
      keycloakUserId: "keycloak-user",
      merchantIds: [],
      active: true,
      locked: false,
    });
  });

  it("reads the full name returned by the BE", () => {
    expect(merchantUserSchema.parse({ ...user, fullName: "Nguyễn Văn Kiên" }).fullName).toBe("Nguyễn Văn Kiên");
  });

  it("keeps the BE name as sent and never fills a missing one", () => {
    expect(merchantUserSchema.parse(user).fullName).toBeUndefined();
    expect(merchantUserSchema.parse({ ...user, fullName: null }).fullName).toBeNull();
  });

  it("returns only the BE fields, with no derived status, groupIds or renamed flags", () => {
    const parsed = merchantUserSchema.parse({ ...user, locked: true, active: false });
    expect(parsed).toMatchObject({ locked: true, active: false, groups: user.groups });
    expect(parsed).not.toHaveProperty("status");
    expect(parsed).not.toHaveProperty("groupIds");
    expect(parsed).not.toHaveProperty("isLocked");
  });

  it("accepts a user with no groups", () => {
    expect(merchantUserSchema.parse(user).groups).toEqual([]);
  });

  it("requires explicit portal activity flags", () => {
    expect(merchantUserSchema.safeParse({ ...user, active: undefined }).success).toBe(false);
  });
});

describe("userFormSchema", () => {
  it("requires a valid email and at least one group", () => {
    expect(userFormSchema.safeParse({ email: "invalid", fullName: "", phone: "123", groupIds: [] }).success).toBe(false);
  });
});

describe("scopeProposalSchema", () => {
  it.each(["PENDING_APPROVAL", "APPROVED", "REJECTED"])("accepts %s with nullable decision reason", (status) => {
    const result = scopeProposalSchema.parse({
      id: user.id,
      merchantUserId: user.id,
      status,
      merchantIds: [],
      subMerchantIds: [],
      requestReason: "Requested change",
      decisionReason: null,
      createdAt: user.createdAt,
      decidedAt: null,
    });
    expect(result.status).toBe(status);
  });
});
