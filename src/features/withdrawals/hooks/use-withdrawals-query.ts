import { useQuery } from '@tanstack/react-query';
import { withdrawalApi, type GetWithdrawalListParams } from '../api/withdrawal.api';
import type { WithdrawalListResponse } from '../types';

export function useWithdrawalsQuery(params: GetWithdrawalListParams = {}) {
  const finalParams = { page: 1, pageSize: 10, ...params };
  return useQuery<WithdrawalListResponse>({
    queryKey: ['withdrawals', finalParams],
    queryFn: () => withdrawalApi.getList(finalParams),
    staleTime: 1000 * 60,
  });
}
