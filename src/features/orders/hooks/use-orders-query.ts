import { useQuery } from '@tanstack/react-query';
import { orderApi, type GetOrderListParams } from '../api/order.api';
import type { OrderListResponse } from '../types';

export function useOrdersQuery(params: GetOrderListParams = {}) {
  const finalParams = { page: 1, pageSize: 10, ...params };
  return useQuery<OrderListResponse>({
    queryKey: ['orders', finalParams],
    queryFn: () => orderApi.getList(finalParams),
    staleTime: 1000 * 60,
  });
}
