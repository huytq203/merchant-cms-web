import { useQuery } from '@tanstack/react-query';
import { refundApi, type GetRefundListParams } from '../api/refund.api';
import type { RefundListResponse } from '../types';

export function useRefundsQuery(params: GetRefundListParams = {}) {
  const finalParams = { page: 1, pageSize: 10, ...params };
  return useQuery<RefundListResponse>({
    queryKey: ['refunds', finalParams],
    queryFn: () => refundApi.getList(finalParams),
    staleTime: 1000 * 60,
  });
}
