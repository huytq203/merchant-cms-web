import { describe, expect, it } from "vitest";
import { capitalizeWords, merchantUserSchema, scopeProposalSchema, userFormSchema } from "../user.schema";

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

  it("accepts a user the BE has not yet bound to a Keycloak subject", () => {
    expect(merchantUserSchema.safeParse({ ...user, keycloakUserId: null }).success).toBe(true);
    const withoutSubject: Partial<typeof user> = { ...user };
    delete withoutSubject.keycloakUserId;
    expect(merchantUserSchema.safeParse(withoutSubject).success).toBe(true);
  });

  it("requires explicit portal activity flags", () => {
    expect(merchantUserSchema.safeParse({ ...user, active: undefined }).success).toBe(false);
  });
});

const validForm = { email: "a@b.vn", fullName: "Nguyễn Văn An", phone: "0912345678", groupIds: ["g"] };
const messageOf = (input: Partial<typeof validForm>, field: string) =>
  userFormSchema.safeParse({ ...validForm, ...input }).error?.issues.filter((issue) => issue.path[0] === field).map((issue) => issue.message);

describe("userFormSchema: họ tên và SĐT (C-U2)", () => {
  it("trims, collapses spaces and capitalizes each word", () => {
    expect(userFormSchema.parse({ ...validForm, fullName: "  nguyễn   văn  an " }).fullName).toBe("Nguyễn Văn An");
    expect(capitalizeWords("đặng thị ánh")).toBe("Đặng Thị Ánh");
  });

  it("reports one message per full-name failure", () => {
    expect(messageOf({ fullName: "   " }, "fullName")).toEqual(["Họ tên không được để trống."]);
    expect(messageOf({ fullName: "An2" }, "fullName")).toEqual(["Họ tên không được chứa số hoặc ký tự đặc biệt."]);
    expect(messageOf({ fullName: "An@" }, "fullName")).toEqual(["Họ tên không được chứa số hoặc ký tự đặc biệt."]);
    expect(messageOf({ fullName: "A" }, "fullName")).toEqual(["Họ tên phải từ 2 đến 100 ký tự."]);
    expect(messageOf({ fullName: "a".repeat(101) }, "fullName")).toEqual(["Họ tên phải từ 2 đến 100 ký tự."]);
    expect(userFormSchema.safeParse({ ...validForm, fullName: "a".repeat(100) }).success).toBe(true);
  });

  it("requires the phone", () => {
    expect(messageOf({ phone: "" }, "phone")).toEqual(["SĐT phải có 10-11 chữ số."]);
    expect(userFormSchema.safeParse({ email: "a@b.vn", fullName: "An Bình", groupIds: ["g"] }).success).toBe(false);
  });

  it.each(["091234567", "091234567890", "09123abc45", "+84912345678"])("rejects %s for length or characters", (phone) => {
    expect(messageOf({ phone }, "phone")).toEqual(["SĐT phải có 10-11 chữ số."]);
  });

  it.each(["1912345678", "0212345678", "02123456789"])("rejects %s for the prefix", (phone) => {
    expect(messageOf({ phone }, "phone")).toEqual(["Đầu số không đúng định dạng VN."]);
  });

  it.each(["0312345678", "0912345678", "09123456789"])("accepts %s", (phone) => {
    expect(userFormSchema.safeParse({ ...validForm, phone }).success).toBe(true);
  });
});

describe("merchantUserSchema: bản nháp", () => {
  it("keeps the optional BE status so the list can drop DRAFT", () => {
    expect(merchantUserSchema.parse({ ...user, status: "DRAFT" }).status).toBe("DRAFT");
    expect(merchantUserSchema.parse(user).status).toBeUndefined();
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
