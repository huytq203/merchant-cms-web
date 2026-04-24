import { apiClient } from '@/lib/http/api-client';
import { useQuery } from '@tanstack/react-query';
import type { SubMerchant, SubMerchantListResponse } from '../types';
import {subMerchantApi } from '../api/SubMerchant'
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
    queryFn: () => subMerchantApi.getAll(params),
    staleTime: 1000 * 60 * 1,
  });
};

export const useSubMerchantByIdQuery = (id: string) => {
  return useQuery<SubMerchant>({
    queryKey: ['sub-merchant', id],
    queryFn: () =>
      subMerchantApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 1,
  });
};
