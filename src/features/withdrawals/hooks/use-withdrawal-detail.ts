import { useQuery } from "@tanstack/react-query";
import { withdrawalQueries } from "../withdrawal-queries";
import type { Withdrawal } from "../types/types";

/** Shows the list row at once and swaps in the fresh record when it arrives. */
export function useWithdrawalDetail(listed: Withdrawal | null) {
  const query = useQuery({
    ...withdrawalQueries.detail(listed?.id ?? ""),
    enabled: listed !== null,
  });
  return {
    withdrawal: query.data ?? listed,
    loadError: query.data ? undefined : query.error?.message,
  };
}
