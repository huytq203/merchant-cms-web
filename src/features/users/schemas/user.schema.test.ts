import { describe, expect, it } from "vitest";
import { merchantUserSchema, scopeProposalSchema, userFormSchema } from "./user.schema";

const user = {
  id: "b4a0f34c-1102-4dc0-84ab-f4c71afbbd4e",
  email: "user@example.com",
  keycloakUserId: "keycloak-user",
  phone: null,
  isActive: true,
  isLocked: false,
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
      isActive: true,
      isLocked: false,
      groups: [],
      merchantIds: [],
      subMerchantIds: [],
      rolesText: "Vận hành",
      createdAt: user.createdAt,
    };

    expect(merchantUserSchema.parse(response)).toMatchObject({
      keycloakUserId: "keycloak-user",
      merchantIds: [],
      isActive: true,
    });
  });

  it("accepts a user with no groups", () => {
    expect(merchantUserSchema.parse(user).groups).toEqual([]);
  });

  it("requires explicit portal activity flags", () => {
    expect(merchantUserSchema.safeParse({ ...user, isActive: undefined }).success).toBe(false);
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
