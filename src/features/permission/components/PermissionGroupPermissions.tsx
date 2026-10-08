'use client';

import { Skeleton } from '@/components/ui/skeleton/Skeleton';
import type { UseQueryResult } from '@tanstack/react-query';
import { buildPermissionCoverage } from '../utils/permission-coverage';
import type { PermissionCatalogItem } from '../schemas/permission-group.schema';
import { PermissionCategoryRow } from './PermissionCategoryRow';

interface Props {
  catalog: UseQueryResult<PermissionCatalogItem[]>;
  grantedCodes: string[];
}

export function PermissionGroupPermissions({ catalog, grantedCodes }: Props) {
  if (catalog.isPending) return <Skeleton className="h-24 w-full" rounded="lg" />;
  if (catalog.isError) return <p role="alert" className="text-sm text-danger">{catalog.error.message}</p>;
  const coverage = buildPermissionCoverage(catalog.data, grantedCodes);
  const percent = coverage.total > 0 ? Math.min(100, Math.round((coverage.granted / coverage.total) * 100)) : 0;

  return (
    <div className="space-y-3">
      <div role="img" aria-label={`Nhóm có ${coverage.granted} trên ${coverage.total} quyền`} className="h-1.5 overflow-hidden rounded-full bg-page">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      {coverage.rows.length > 0 ? (
        <ul className="max-h-[280px] divide-y divide-border overflow-y-auto rounded-xl border border-border">
          {coverage.rows.map((row) => (
            <PermissionCategoryRow key={row.category} row={row} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Nhóm chưa có quyền nào.</p>
      )}
      {coverage.rows.length > 0 && coverage.emptyLabels.length > 0 ? (
        <p className="text-[13px] text-muted-foreground">{`Không có quyền ở: ${coverage.emptyLabels.join(', ')}.`}</p>
      ) : null}
    </div>
  );
}
