import { usePathname, useRouter } from 'next/navigation';

export function useSubMerchantListNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const changePage = (page: number, pageSize: number) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    router.push(`${pathname}?${params}`);
  };

  return { changePage };
}
