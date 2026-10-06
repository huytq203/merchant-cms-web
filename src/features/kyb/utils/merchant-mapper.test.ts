import { describe, expect, it } from "vitest";
import {
  canEditMerchant,
  registrationConditions,
  toMerchantUpdate,
} from "./merchant-mapper";
import type { MerchantProfile } from "../types";

const merchant: MerchantProfile = {
  id: "11111111-1111-4111-8111-111111111111",
  status: "DRAFT",
};

describe("merchant mapper", () => {
  it("allows editing only draft and rejected merchants", () => {
    expect(canEditMerchant({ status: "DRAFT" })).toBe(true);
    expect(canEditMerchant({ status: "REJECTED" })).toBe(true);
    expect(canEditMerchant({ status: "PENDING_APPROVAL" })).toBe(false);
    expect(canEditMerchant({ status: "ACTIVE" })).toBe(false);
  });

  it("drops blank text and never carries an admin password", () => {
    const body = toMerchantUpdate({
      mccCode: "5812",
      name: "Quán A",
      websiteUrl: "",
      supportContact: "0912345678",
      productDescription: "",
      contractSignedWithSub: false,
    }, { logoStagingId: "22222222-2222-4222-8222-222222222222" });
    expect(body).not.toHaveProperty("websiteUrl");
    expect(body).not.toHaveProperty("productDescription");
    expect(body).not.toHaveProperty("adminPassword");
    expect(body).toMatchObject({ mccCode: "5812", contractSignedWithSub: false });
    expect(body).toHaveProperty("logoStagingId");
  });

  it("reads registration conditions from the embedded wallet", () => {
    expect(registrationConditions(merchant)).toEqual({ kybVerified: false, bankLinked: false });
    expect(registrationConditions({
      ...merchant,
      enterpriseWallet: {
        id: "33333333-3333-4333-8333-333333333333",
        registeredEmail: "owner@example.com",
        verificationStatus: "VERIFIED",
        bankLinkStatus: "BANK_LINKED",
      },
    })).toEqual({ kybVerified: true, bankLinked: true });
  });
});
