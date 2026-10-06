import { usePathname, useRouter } from 'next/navigation';
import type { PermissionGroupFilter } from '../permission-group-queries';
import { buildPermissionGroupUrl } from '../utils/permission-group-url';

export function usePermissionGroupNavigation(filter: PermissionGroupFilter) {
  const router = useRouter();
  const pathname = usePathname();
  const navigate = (next: PermissionGroupFilter) => {
    router.push(buildPermissionGroupUrl(pathname, next));
  };

  const search = (query: string, scope: string) => {
    const keyword = query.trim();
    navigate({
      page: 1,
      pageSize: filter.pageSize,
      ...(keyword ? { query: keyword } : {}),
      ...(scope ? { systemOnly: scope === 'true' } : {}),
    });
  };
  const changePage = (page: number, pageSize: number) => {
    navigate({ ...filter, page, pageSize });
  };

  return { search, changePage };
}
