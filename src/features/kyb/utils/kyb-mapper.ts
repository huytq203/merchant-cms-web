import { walletFormSchema, walletSubmitSchema } from "../schemas/enterprise-wallet.schema";
import type {
  EnterpriseWallet,
  KybDocumentKey,
  StagingIds,
  WalletDraftValues,
  WalletFormValues,
} from "../types";

export type KybStage = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

export const REQUIRED_DOCUMENTS: readonly KybDocumentKey[] = [
  "businessLicenseStagingId",
  "idCardFrontStagingId",
  "idCardBackStagingId",
];

const EXISTING_FILE_FIELD: Record<KybDocumentKey, keyof EnterpriseWallet> = {
  businessLicenseStagingId: "businessLicense",
  idCardFrontStagingId: "idCardFront",
  idCardBackStagingId: "idCardBack",
  authorizationLetterStagingId: "authorizationLetter",
};

export function toWalletRequest(values: WalletDraftValues, stagingIds: StagingIds) {
  const merged = { ...values, ...stagingIds };
  return Object.fromEntries(
    Object.entries(merged).filter(([, value]) => value !== "" && value !== undefined),
  );
}

export function kybProgress(wallet: Pick<EnterpriseWallet, "verificationStatus" | "kybRejectedReason">) {
  const stage: KybStage = wallet.verificationStatus === "PENDING_APPROVAL"
    ? "PENDING"
    : wallet.verificationStatus === "VERIFIED"
      ? "APPROVED"
      : wallet.verificationStatus;
  return {
    stage,
    ...(wallet.kybRejectedReason ? { rejectedReason: wallet.kybRejectedReason } : {}),
  };
}

export function canEditKyb(wallet: Pick<EnterpriseWallet, "verificationStatus">) {
  return wallet.verificationStatus === "DRAFT" || wallet.verificationStatus === "REJECTED";
}

export function canSubmitKyb(values: WalletDraftValues, stagingIds: StagingIds) {
  return walletSubmitSchema.safeParse({ ...values, ...stagingIds }).success;
}

export function maskIdNumber(value: string) {
  return `${"•".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

export function hasStoredDocument(wallet: EnterpriseWallet, key: KybDocumentKey) {
  return Boolean(wallet[EXISTING_FILE_FIELD[key]]);
}

/** Required documents that have neither a fresh upload nor a file already on the wallet. */
export function missingDocuments(wallet: EnterpriseWallet, stagingIds: StagingIds) {
  return REQUIRED_DOCUMENTS.filter((key) => !stagingIds[key] && !hasStoredDocument(wallet, key));
}

export function needsAuthorizationLetter(
  values: Pick<WalletFormValues, "managerName" | "legalRepresentativeName">,
) {
  return values.managerName.trim() !== values.legalRepresentativeName.trim();
}

export function walletToFormValues(wallet: EnterpriseWallet): WalletFormValues {
  return {
    registeredEmail: wallet.registeredEmail,
    legalName: wallet.legalName ?? "",
    taxCode: wallet.taxCode ?? "",
    businessType: wallet.businessType ?? "ENTERPRISE",
    headOfficeAddress: wallet.headOfficeAddress ?? "",
    legalRepresentativeName: wallet.legalRepresentativeName ?? "",
    legalRepresentativeIdNumber: wallet.legalRepresentativeIdNumber ?? "",
    managerName: wallet.managerName ?? "",
    managerTitle: wallet.managerTitle ?? "",
    managerIdNumber: wallet.managerIdNumber ?? "",
    managerIdExpiryDate: wallet.managerIdExpiryDate ?? "",
    otpPhone: wallet.otpPhone ?? "",
  };
}

export function isWalletFormComplete(values: WalletFormValues) {
  return walletFormSchema.safeParse(values).success;
}

/** Body of the wallet update: the email is fixed and the internal-wallet flag is Flexpay's, so neither is sent. */
export function toWalletUpdate(values: Partial<WalletFormValues> & { internalWallet?: boolean }, stagingIds: StagingIds) {
  const { registeredEmail: _registeredEmail, internalWallet: _internalWallet, ...editable } = values;
  void _registeredEmail;
  void _internalWallet;
  return toWalletRequest(editable, stagingIds);
}
