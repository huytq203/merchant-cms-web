import type { MerchantFormValues, MerchantProfile, MerchantStagingIds } from "../types";

export function canEditMerchant(merchant: Pick<MerchantProfile, "status">) {
  return merchant.status === "DRAFT" || merchant.status === "REJECTED";
}

export function merchantToFormValues(merchant: MerchantProfile): MerchantFormValues {
  return {
    mccCode: merchant.mccCode ?? "",
    name: merchant.name ?? "",
    websiteUrl: merchant.websiteUrl ?? "",
    supportContact: merchant.supportContact ?? "",
    productDescription: merchant.productDescription ?? "",
    contractSignedWithSub: merchant.contractSignedWithSub ?? false,
  };
}

/** Body of `PUT /merchants/{id}`: blank text is dropped and `adminPassword` is never sent. */
export function toMerchantUpdate(values: MerchantFormValues, stagingIds: MerchantStagingIds) {
  const merged = { ...values, ...stagingIds };
  return Object.fromEntries(
    Object.entries(merged).filter(([, value]) => value !== "" && value !== undefined),
  );
}

/** The two conditions the ĐVCNTT form can verify from the wallet embedded in the merchant. */
export function registrationConditions(merchant: MerchantProfile) {
  const wallet = merchant.enterpriseWallet;
  return {
    kybVerified: wallet?.verificationStatus === "VERIFIED",
    bankLinked: wallet?.bankLinkStatus === "BANK_LINKED",
  };
}
