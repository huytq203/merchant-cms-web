import { useQuery } from '@tanstack/react-query';
import mockData from '@/mock/data-merchant.json';
import type { Merchant } from '../types';

export function useMerchantDetailQuery(id: string | null) {
  return useQuery<Merchant | null>({
    queryKey: ['merchant', id],
    queryFn: () =>
      new Promise<Merchant | null>((resolve) =>
        setTimeout(() => {
          const found = mockData.merchants.find((m) => m.id === id) as Merchant | undefined;
          resolve(found ?? null);
        }, 400)
      ),
    enabled: !!id,
    staleTime: 30_000,
  });
}
