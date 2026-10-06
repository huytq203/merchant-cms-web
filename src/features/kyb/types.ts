import type { z } from "zod";
import type {
  enterpriseWalletSchema,
  storedFileSchema,
  walletDraftSchema,
  walletFormSchema,
  walletSubmitSchema,
} from "./schemas/enterprise-wallet.schema";
import type {
  merchantFormSchema,
  merchantProfileSchema,
  merchantStagingSchema,
  merchantStatusHistorySchema,
} from "./schemas/merchant-profile.schema";

export type EnterpriseWallet = z.infer<typeof enterpriseWalletSchema>;
export type StoredFile = z.infer<typeof storedFileSchema>;
export type WalletDraftValues = z.infer<typeof walletDraftSchema>;
export type WalletFormValues = z.infer<typeof walletFormSchema>;
export type WalletSubmitValues = z.infer<typeof walletSubmitSchema>;
export type MerchantProfile = z.infer<typeof merchantProfileSchema>;
export type MerchantFormValues = z.infer<typeof merchantFormSchema>;
export type MerchantStagingIds = z.infer<typeof merchantStagingSchema>;
export type MerchantStatusHistory = z.infer<typeof merchantStatusHistorySchema>;
export type StagingIds = Partial<Pick<WalletDraftValues,
  | "businessLicenseStagingId"
  | "idCardFrontStagingId"
  | "idCardBackStagingId"
  | "authorizationLetterStagingId"
>>;
export type KybDocumentKey = keyof StagingIds;

export type StatusHistoryResult = {
  rows: MerchantStatusHistory[];
  total: number;
};
