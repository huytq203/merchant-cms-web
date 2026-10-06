import { describe, expect, it } from "vitest";

import { canLock, canUnlock, toCreateRequest, toSubMerchantDetail, toSubMerchantRow, toUpdateRequest } from "./sub-merchant-mapper";

const values = { name: " Điểm A ", businessField: "", inheritPhone: true, phone: "", inheritAddress: false, address: "1 Lê Lợi" };

describe("response mapping", () => {
  const summary = { id: "11111111-1111-4111-8111-111111111111", code: "MC01-001", name: "Điểm A", status: "ACTIVE", isDefault: false };

  it("maps a summary DTO to a row", () => {
    expect(toSubMerchantRow(summary)).toMatchObject(summary);
  });

  it("maps a detail DTO with inherited fields", () => {
    const dto = {
      ...summary,
      merchantId: "22222222-2222-4222-8222-222222222222",
      taxCodeEditable: false,
      phone: { value: null, source: null, inherited: true, suspended: false },
      address: { value: "1 Lê Lợi", source: null, inherited: false, suspended: false },
    };
    expect(toSubMerchantDetail(dto)).toMatchObject(dto);
  });
});

describe("toCreateRequest", () => {
  it("sends inherit flags instead of blank values and omits empty optional fields", () => {
    expect(toCreateRequest(values, "m-1")).toEqual({
      merchantId: "m-1",
      name: "Điểm A",
      inheritPhone: true,
      inheritAddress: false,
      address: "1 Lê Lợi",
    });
  });
});

describe("toUpdateRequest", () => {
  it("never sends merchantId or KYB fields", () => {
    const body = toUpdateRequest(values);
    expect(body).not.toHaveProperty("merchantId");
    expect(body).not.toHaveProperty("taxCode");
  });
});

describe("lock rules", () => {
  const row = { status: "ACTIVE", lockSource: null } as const;
  it("allows locking an active node only", () => {
    expect(canLock(row)).toBe(true);
    expect(canLock({ status: "INACTIVE", lockSource: "DIRECT" })).toBe(false);
    expect(canLock({ status: "TERMINATED", lockSource: null })).toBe(false);
  });
  it("allows unlocking a directly locked node only", () => {
    expect(canUnlock({ status: "INACTIVE", lockSource: "DIRECT" })).toBe(true);
    expect(canUnlock({ status: "INACTIVE", lockSource: "CASCADE" })).toBe(false);
    expect(canUnlock(row)).toBe(false);
  });
});
