import { useQuery } from '@tanstack/react-query';
import mockData from '@/mock/data-merchant.json';
import type { MerchantListFilter, MerchantListResponse } from '../types';

const MOCK_DELAY = 600;

function filterMerchants(filter: MerchantListFilter) {
  let results = [...mockData.merchants] as MerchantListResponse['merchants'];

  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase();
    results = results.filter(
      (m) =>
        m.name?.toLowerCase().includes(kw) ||
        m.code.toLowerCase().includes(kw) ||
        m.email.toLowerCase().includes(kw) ||
        m.phone?.includes(kw)
    );
  }
  if (filter.businessType) {
    results = results.filter((m) => m.businessType === filter.businessType);
  }
  if (filter.status) {
    results = results.filter((m) => m.status === filter.status);
  }
  if (filter.salesStaffId) {
    results = results.filter((m) => m.salesStaffId === filter.salesStaffId);
  }
  if (filter.registeredFrom) {
    results = results.filter(
      (m) => new Date(m.registeredAt) >= filter.registeredFrom!
    );
  }
  if (filter.registeredTo) {
    results = results.filter(
      (m) => new Date(m.registeredAt) <= filter.registeredTo!
    );
  }
  if (filter.activatedFrom) {
    results = results.filter(
      (m) => m.activatedAt && new Date(m.activatedAt) >= filter.activatedFrom!
    );
  }
  if (filter.activatedTo) {
    results = results.filter(
      (m) => m.activatedAt && new Date(m.activatedAt) <= filter.activatedTo!
    );
  }

  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? 20;
  const total = results.length;
  const paged = results.slice((page - 1) * pageSize, page * pageSize);

  return { merchants: paged, pagination: { total, page, pageSize } };
}

export function useMerchantsQuery(filter: MerchantListFilter) {
  return useQuery<MerchantListResponse>({
    queryKey: ['merchants', filter],
    queryFn: () =>
      new Promise<MerchantListResponse>((resolve) =>
        setTimeout(() => resolve(filterMerchants(filter)), MOCK_DELAY)
      ),
    staleTime: 30_000,
  });
}
