import { usePathname, useRouter } from 'next/navigation';
import type { AuditFilter } from '../types';

/**
 * Ghi bộ lọc lên URL. Kỳ 7/30 ngày chỉ ghi `period` (không ghi ngày) để mở lại link vẫn là "7 ngày tính đến lúc
 * xem", không phải 7 ngày của lúc chép link.
 */
function toSearchParams(filter: AuditFilter): URLSearchParams {
  const params = new URLSearchParams();
  const preset = filter.period === '7d' || filter.period === '30d';
  for (const [key, value] of Object.entries(filter)) {
    if (preset && (key === 'occurredFrom' || key === 'occurredTo')) continue;
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
  // "Xóa lọc" = xem tất cả: kỳ tự chọn không có ngày, không tự điền lại 7 ngày.
  const clear = () => navigate({ page: 1, pageSize: filter.pageSize, period: 'custom' });
  const changePage = (page: number, pageSize: number) => navigate({ ...filter, page, pageSize });

  return { search: navigate, clear, changePage };
}
