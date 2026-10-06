import type { PermissionGroupFilter } from '../permission-group-queries';

export function buildPermissionGroupUrl(pathname: string, filter: PermissionGroupFilter): string {
  const params = new URLSearchParams({
    page: String(filter.page),
    pageSize: String(filter.pageSize),
  });
  if (filter.query) params.set('keyword', filter.query);
  if (filter.systemOnly !== undefined) params.set('systemOnly', String(filter.systemOnly));
  return `${pathname}?${params}`;
}
