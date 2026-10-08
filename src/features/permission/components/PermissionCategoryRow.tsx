'use client';

import { useId, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { useFitChips } from '../hooks/use-fit-chips';
import type { PermissionCoverageRow } from '../utils/permission-coverage';

interface Props {
  row: PermissionCoverageRow;
}

/** One functional group: collapsed to a single line of whole labels, with the overflow count in its own column. */
export function PermissionCategoryRow({ row }: Props) {
  const [expanded, setExpanded] = useState(false);
  const chipsId = useId();
  const { containerRef, hiddenCount } = useFitChips(row.granted.join('|'), row.granted.length);
  const hasOverflow = hiddenCount > 0;

  return (
    <li className={cn('grid grid-cols-[minmax(0,1fr)_5.5rem] gap-x-3 gap-y-1.5 px-3.5 py-2.5 sm:grid-cols-[8.25rem_minmax(0,1fr)_5.5rem]', !expanded && 'min-h-[46px] items-center')}>
      <p className="col-span-2 flex items-center justify-between gap-1.5 text-[13px] font-semibold text-foreground sm:col-span-1">
        {row.label}
        <span className="text-xs font-medium tabular-nums text-muted-foreground">{`${row.granted.length}/${row.total}`}</span>
      </p>
      <ul id={chipsId} ref={containerRef} aria-label={`Quyền nhóm ${row.label}`} className={cn('flex flex-wrap gap-1.5', !expanded && 'max-h-[26px] overflow-hidden')}>
        {row.granted.map((label) => (
          <li key={label} className="inline-flex h-[26px] items-center whitespace-nowrap rounded-md bg-muted px-2.5 text-xs font-medium text-brand-ink">
            {label}
          </li>
        ))}
      </ul>
      <div className="flex justify-end">
        {hasOverflow ? (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={chipsId}
            onClick={() => setExpanded((current) => !current)}
            className="whitespace-nowrap rounded-md border border-border bg-background px-2 py-0.5 text-xs font-semibold text-primary hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            {expanded ? 'Thu gọn' : `+${hiddenCount} quyền`}
          </button>
        ) : null}
      </div>
    </li>
  );
}
