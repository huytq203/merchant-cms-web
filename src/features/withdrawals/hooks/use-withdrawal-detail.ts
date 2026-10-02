import { useQuery } from "@tanstack/react-query";
import { withdrawalApi } from "@/lib/api/withdrawal.api";
import type { Withdrawal } from "../types/types";

export function useWithdrawalDetail(id: string | null) {
  return useQuery<Withdrawal>({
    queryKey: ["withdrawal-detail", id],
    queryFn: () => withdrawalApi.getById(id!),
    enabled: !!id,
    staleTime: 1000 * 60,
  });
}
