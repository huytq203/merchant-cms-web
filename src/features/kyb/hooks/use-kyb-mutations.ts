import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SensitiveOtp, SensitiveOtpChallenge } from "@/lib/schemas/sensitive-otp";
import { kybRequest } from "../kyb-api";
import type {
  EnterpriseWallet,
  MerchantFormValues,
  MerchantProfile,
  MerchantStagingIds,
  StagingIds,
  WalletFormValues,
} from "../types";
import { toWalletUpdate } from "../utils/kyb-mapper";

/** Reloads the profile (and the status trail behind its progress steps) after a write. */
export function useRefreshProfile(merchantId: string) {
  const client = useQueryClient();
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["kyb", "profile", merchantId] }),
      client.invalidateQueries({ queryKey: ["kyb", "history", merchantId] }),
    ]);
  };
}

type WalletSaveInput = {
  values: Partial<WalletFormValues>;
  stagingIds: StagingIds;
  /** Needed only when the dossier is already verified and the change sends it back to review. */
  otp?: SensitiveOtp;
};

export function useSaveWallet(wallet: EnterpriseWallet) {
  return useMutation({
    mutationFn: ({ values, stagingIds, otp }: WalletSaveInput) => kybRequest<EnterpriseWallet>(
      `/wallets/${wallet.id}`,
      { method: "PUT", body: JSON.stringify({ ...toWalletUpdate(values, stagingIds), ...(otp ? { otp } : {}) }) },
    ),
  });
}

export function useSubmitWallet(walletId: string) {
  return useMutation({
    mutationFn: (otp: SensitiveOtp) => kybRequest<EnterpriseWallet>(
      `/wallets/${walletId}/submit`,
      { method: "POST", body: JSON.stringify({ otp }) },
    ),
  });
}

export function useKybOtpChallenge() {
  return useMutation({
    mutationFn: () => kybRequest<SensitiveOtpChallenge>("/otp-challenge", { method: "POST" }),
  });
}

type MerchantSaveInput = {
  values: MerchantFormValues;
  stagingIds: MerchantStagingIds;
};

export function useSaveMerchant(merchantId: string) {
  return useMutation({
    mutationFn: ({ values, stagingIds }: MerchantSaveInput) => kybRequest<MerchantProfile>(
      `/merchants/${merchantId}`,
      { method: "PUT", body: JSON.stringify({ ...values, ...stagingIds }) },
    ),
  });
}

export function useSubmitMerchant(merchantId: string) {
  return useMutation({
    mutationFn: () => kybRequest<MerchantProfile>(`/merchants/${merchantId}/submit`, { method: "POST" }),
  });
}
