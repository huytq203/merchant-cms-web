import { describe, expect, it } from "vitest";

import { canLock, canUnlock, toCreateRequest, toSubMerchantDetail, toSubMerchantRow, toUpdateRequest } from "../sub-merchant-mapper";

const values = { name: " Điểm A ", mccCode: "", contractStagingId: "", inheritPhone: true, phone: "", inheritAddress: false, address: "1 Lê Lợi" };

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

describe("ngành nghề và hợp đồng riêng", () => {
  const stagingId = "33333333-3333-4333-8333-333333333333";
  it("sends mccCode and contractStagingId on create and never businessField", () => {
    const body = toCreateRequest({ ...values, mccCode: "5812", contractStagingId: stagingId }, "m-1");
    expect(body).toMatchObject({ mccCode: "5812", contractStagingId: stagingId });
    expect(body).not.toHaveProperty("businessField");
  });
  it("omits an empty mccCode so the BE defaults to the Master's industry", () => {
    expect(JSON.parse(JSON.stringify(toCreateRequest(values, "m-1")))).not.toHaveProperty("mccCode");
  });
  it("sends the new contract and industry on update only when chosen", () => {
    expect(toUpdateRequest({ ...values, mccCode: "5411", contractStagingId: stagingId })).toMatchObject({ mccCode: "5411", contractStagingId: stagingId });
    expect(JSON.parse(JSON.stringify(toUpdateRequest(values)))).not.toHaveProperty("contractStagingId");
  });
  it("maps the detail fields mccCode, contractRequired and contractFile", () => {
    const dto = {
      id: "22222222-2222-4222-8222-222222222222", merchantId: "11111111-1111-4111-8111-111111111111", code: "S1", name: "Điểm A", status: "ACTIVE",
      isDefault: false, taxCodeEditable: false, mccCode: "5812", contractRequired: true,
      contractFile: { id: "33333333-3333-4333-8333-333333333333", filename: "hd.pdf", contentType: "application/pdf", sizeBytes: 10, checksum: "abc", url: "https://x/y", urlExpiresAt: "2099-01-01T00:00:00Z" },
      phone: { value: null, source: null, inherited: true, suspended: false }, address: { value: null, source: null, inherited: true, suspended: false },
    };
    expect(toSubMerchantDetail(dto)).toMatchObject({ mccCode: "5812", contractRequired: true, contractFile: { filename: "hd.pdf", url: "https://x/y" } });
  });
});
