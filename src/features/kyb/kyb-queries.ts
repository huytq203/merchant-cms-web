import { queryOptions } from "@tanstack/react-query";
import { kybRequest } from "./kyb-api";
import type { MerchantProfile, StatusHistoryResult } from "./types";

const REVIEW_REFRESH_MS = 30_000;

/** True while an admin still has to decide on the KYB dossier or the ĐVCNTT profile. */
export function isAwaitingReview(profile: MerchantProfile | undefined) {
  if (!profile) return false;
  return profile.status === "PENDING_APPROVAL"
    || profile.enterpriseWallet?.verificationStatus === "PENDING_APPROVAL";
}

export const kybQueries = {
  profile: (merchantId: string) => queryOptions({
    queryKey: ["kyb", "profile", merchantId] as const,
    queryFn: () => kybRequest<MerchantProfile>(`/merchants/${merchantId}`),
    // Polls only while awaiting review; TanStack pauses interval refetch when the tab is hidden.
    refetchInterval: (query) => isAwaitingReview(query.state.data) ? REVIEW_REFRESH_MS : false,
  }),
  history: (merchantId: string, page: number) => queryOptions({
    queryKey: ["kyb", "history", merchantId, page] as const,
    queryFn: () => kybRequest<StatusHistoryResult>(`/merchants/${merchantId}/status-history?page=${page}`),
  }),
};
