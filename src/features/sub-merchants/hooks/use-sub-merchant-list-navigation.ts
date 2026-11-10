import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { SubMerchantFilterValues } from '../schemas';

export function useSubMerchantListNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const changePage = (page: number, pageSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    router.push(`${pathname}?${params}`);
  };

  /** A new search always starts from the first page and keeps the chosen page size. */
  const search = (values: SubMerchantFilterValues) => {
    const params = new URLSearchParams({ page: '1' });
    const pageSize = searchParams.get('pageSize');
    if (pageSize) params.set('pageSize', pageSize);
    if (values.code) params.set('code', values.code);
    if (values.name) params.set('name', values.name);
    if (values.status) params.set('status', values.status);
    if (values.hasBankAccount !== undefined) params.set('hasBankAccount', String(values.hasBankAccount));
    if (values.createdFrom) params.set('createdFrom', values.createdFrom);
    if (values.createdTo) params.set('createdTo', values.createdTo);
    router.push(`${pathname}?${params}`);
  };

  return { changePage, search };
}
