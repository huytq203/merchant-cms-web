import { useMutation, useQueryClient } from "@tanstack/react-query";
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

function useRefreshProfile(merchantId: string) {
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
};

export function useSaveWallet(merchantId: string, wallet: EnterpriseWallet) {
  const refresh = useRefreshProfile(merchantId);
  return useMutation({
    mutationFn: ({ values, stagingIds }: WalletSaveInput) => kybRequest<EnterpriseWallet>(
      `/wallets/${wallet.id}`,
      { method: "PUT", body: JSON.stringify(toWalletUpdate(wallet, values, stagingIds)) },
    ),
    onSuccess: refresh,
  });
}

export function useSubmitWallet(merchantId: string, walletId: string) {
  const refresh = useRefreshProfile(merchantId);
  return useMutation({
    mutationFn: () => kybRequest<EnterpriseWallet>(`/wallets/${walletId}/submit`, { method: "POST" }),
    onSuccess: refresh,
  });
}

type MerchantSaveInput = {
  values: MerchantFormValues;
  stagingIds: MerchantStagingIds;
};

export function useSaveMerchant(merchantId: string) {
  const refresh = useRefreshProfile(merchantId);
  return useMutation({
    mutationFn: ({ values, stagingIds }: MerchantSaveInput) => kybRequest<MerchantProfile>(
      `/merchants/${merchantId}`,
      { method: "PUT", body: JSON.stringify({ ...values, ...stagingIds }) },
    ),
    onSuccess: refresh,
  });
}

export function useSubmitMerchant(merchantId: string) {
  const refresh = useRefreshProfile(merchantId);
  return useMutation({
    mutationFn: () => kybRequest<MerchantProfile>(`/merchants/${merchantId}/submit`, { method: "POST" }),
    onSuccess: refresh,
  });
}
