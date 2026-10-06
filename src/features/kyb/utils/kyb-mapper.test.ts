import { describe, expect, it } from "vitest";
import {
  canEditKyb,
  canSubmitKyb,
  kybProgress,
  maskIdNumber,
  missingDocuments,
  toWalletRequest,
  toWalletUpdate,
} from "./kyb-mapper";
import type { EnterpriseWallet } from "../types";
import { kybStepSchemas } from "../schemas/enterprise-wallet.schema";

const values = {
  registeredEmail: "owner@example.com",
  legalName: "Công ty A",
  taxCode: "0123456789",
  businessType: "ENTERPRISE" as const,
  headOfficeAddress: "Hà Nội",
  legalRepresentativeName: "Nguyễn A",
  legalRepresentativeIdNumber: "P123456",
  managerName: "Nguyễn A",
  managerTitle: "Giám đốc",
  managerIdNumber: "012345678901",
  managerIdExpiryDate: "2099-01-01",
  otpPhone: "0912345678",
  internalWallet: false,
};
const stagingIds = {
  businessLicenseStagingId: "11111111-1111-4111-8111-111111111111",
  idCardFrontStagingId: "22222222-2222-4222-8222-222222222222",
  idCardBackStagingId: "33333333-3333-4333-8333-333333333333",
};

describe("KYB validation and mapping", () => {
  it("accepts only enterprise or household business types", () => {
    expect(kybStepSchemas.legal.safeParse(values).success).toBe(true);
    expect(kybStepSchemas.legal.safeParse({ ...values, businessType: "PERSONAL" }).success).toBe(false);
  });
  it("rejects an expired manager ID", () => {
    expect(kybStepSchemas.representative.safeParse({ ...values, managerIdExpiryDate: "2000-01-01" }).success).toBe(false);
  });
  it("requires a business license to submit", () => {
    expect(canSubmitKyb(values, { ...stagingIds, businessLicenseStagingId: undefined })).toBe(false);
    expect(canSubmitKyb(values, stagingIds)).toBe(true);
  });
  it("allows editing only draft and rejected records", () => {
    expect(canEditKyb({ verificationStatus: "DRAFT" })).toBe(true);
    expect(canEditKyb({ verificationStatus: "REJECTED" })).toBe(true);
    expect(canEditKyb({ verificationStatus: "PENDING_APPROVAL" })).toBe(false);
    expect(canEditKyb({ verificationStatus: "VERIFIED" })).toBe(false);
  });
  it("masks all but the last four characters", () => {
    expect(maskIdNumber("012345678901")).toBe("••••••••8901");
  });
  it("omits empty strings and administrator password", () => {
    const request = toWalletRequest({ ...values, managerTitle: "" }, stagingIds);
    expect(request).not.toHaveProperty("managerTitle");
    expect(request).not.toHaveProperty("adminPassword");
  });
  it("maps verification status to a stage and keeps the rejection reason", () => {
    expect(kybProgress({ verificationStatus: "VERIFIED" }).stage).toBe("APPROVED");
    expect(kybProgress({ verificationStatus: "PENDING_APPROVAL" }).stage).toBe("PENDING");
    expect(kybProgress({ verificationStatus: "REJECTED", kybRejectedReason: "Ảnh mờ" }))
      .toEqual({ stage: "REJECTED", rejectedReason: "Ảnh mờ" });
  });
  it("requires an authorization letter when manager differs from the representative", () => {
    const other = { ...values, managerName: "Trần B" };
    expect(canSubmitKyb(other, stagingIds)).toBe(false);
    expect(canSubmitKyb(other, {
      ...stagingIds,
      authorizationLetterStagingId: "44444444-4444-4444-8444-444444444444",
    })).toBe(true);
  });
  it("treats stored files as present when looking for missing documents", () => {
    const wallet = {
      id: "55555555-5555-4555-8555-555555555555",
      registeredEmail: "owner@example.com",
      verificationStatus: "REJECTED",
      businessLicense: { id: "66666666-6666-4666-8666-666666666666" },
    } satisfies EnterpriseWallet;
    expect(missingDocuments(wallet, {})).toEqual(["idCardFrontStagingId", "idCardBackStagingId"]);
    expect(missingDocuments(wallet, { idCardFrontStagingId: stagingIds.idCardFrontStagingId }))
      .toEqual(["idCardBackStagingId"]);
  });
  it("builds the update body without the email and with the current internal flag", () => {
    const wallet: EnterpriseWallet = {
      id: "55555555-5555-4555-8555-555555555555",
      registeredEmail: "owner@example.com",
      verificationStatus: "DRAFT",
      internalWallet: true,
    };
    const body = toWalletUpdate(wallet, values, {});
    expect(body).not.toHaveProperty("registeredEmail");
    expect(body).toMatchObject({ legalName: "Công ty A", internalWallet: true });
  });
});
