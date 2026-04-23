import { apiClient } from '@/lib/http/api-client';
import { useQuery } from '@tanstack/react-query';
import type { SubMerchantListResponse } from '../types';

interface GetSubMerchantsParams {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export const useSubMerchantsQuery = (params: GetSubMerchantsParams) => {
  return useQuery<SubMerchantListResponse>({
    queryKey: ['sub-merchants', params],
    queryFn: () =>
      apiClient.get<SubMerchantListResponse>('/v1/admin/merchants/sub-merchants', {
        query: params,
      }),
    staleTime: 1000 * 60 * 1,
  });
};
