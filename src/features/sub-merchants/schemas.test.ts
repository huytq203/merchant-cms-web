import { describe, expect, it } from "vitest";

import { subMerchantFormSchema, subMerchantSummarySchema } from "./schemas";

describe("subMerchantSummarySchema", () => {
  it("parses the BE summary, including isDefault", () => {
    const parsed = subMerchantSummarySchema.safeParse({
      id: "11111111-1111-4111-8111-111111111111",
      code: "MC01-001",
      name: "Cửa hàng Quận 1",
      status: "ACTIVE",
      isDefault: false,
    });
    expect(parsed.success).toBe(true);
  });

  it("reads the flag from `default`, the name Jackson gives a Lombok `isDefault` boolean", () => {
    const parsed = subMerchantSummarySchema.safeParse({
      id: "11111111-1111-4111-8111-111111111111",
      code: "MC01-001",
      name: "Cửa hàng Quận 1",
      status: "ACTIVE",
      default: true,
    });
    expect(parsed.success && parsed.data.isDefault).toBe(true);
  });

  it("rejects an unknown status", () => {
    const parsed = subMerchantSummarySchema.safeParse({
      id: "11111111-1111-4111-8111-111111111111",
      code: "c",
      name: "n",
      status: "LOCKED",
      isDefault: false,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("subMerchantFormSchema", () => {
  const base = { name: "Điểm bán A", businessField: "", inheritPhone: true, phone: "", inheritAddress: true, address: "" };

  it("accepts inherited phone/address without values", () => {
    expect(subMerchantFormSchema.safeParse(base).success).toBe(true);
  });
  it("requires an own phone once inheritance is switched off", () => {
    const parsed = subMerchantFormSchema.safeParse({ ...base, inheritPhone: false });
    expect(parsed.success).toBe(false);
  });
  it("requires an own address once inheritance is switched off", () => {
    expect(subMerchantFormSchema.safeParse({ ...base, inheritAddress: false }).success).toBe(false);
  });
  it("rejects a name over 255 characters", () => {
    expect(subMerchantFormSchema.safeParse({ ...base, name: "a".repeat(256) }).success).toBe(false);
  });
});
