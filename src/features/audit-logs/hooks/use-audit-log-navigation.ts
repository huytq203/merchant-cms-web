import { usePathname, useRouter } from 'next/navigation';
import type { AuditFilter } from '../types';

function toSearchParams(filter: AuditFilter): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params;
}

export function useAuditLogNavigation(filter: AuditFilter) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (next: AuditFilter) => {
    router.push(`${pathname}?${toSearchParams(next)}`);
  };
  const clear = () => navigate({ page: 1, pageSize: filter.pageSize });
  const changePage = (page: number, pageSize: number) => navigate({ ...filter, page, pageSize });

  return { search: navigate, clear, changePage };
}
