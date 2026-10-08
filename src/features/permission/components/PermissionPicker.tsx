'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs/Tabs';
import { cn } from '@/lib/utils/cn';
import type { PermissionCatalogItem } from '../schemas/permission-group.schema';
import { groupPermissionsByCategory } from '../utils/permission-group-mapper';
import { PermissionCategoryGroup } from './PermissionCategoryGroup';

interface Props {
  catalog: PermissionCatalogItem[];
  isLoading?: boolean;
  selected: string[];
  onToggle: (code: string) => void;
  onSelectAll: (codes: string[]) => void;
}

const railClassName = [
  'w-full flex-col items-stretch justify-start gap-0.5 self-stretch rounded-none border-r border-border bg-page p-1.5',
  'max-sm:flex-row max-sm:overflow-x-auto max-sm:border-b max-sm:border-r-0',
  // Basuicn renders a sliding indicator as the first child; the active tab gets a brand ring instead.
  '[&>:first-child]:hidden',
].join(' ');

const tabClassName = [
  'w-full justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent',
  'data-active:bg-background data-active:text-brand-ink data-active:ring-1 data-active:ring-inset data-active:ring-brand',
  'max-sm:w-auto max-sm:shrink-0',
].join(' ');

function CountPill({ count, total }: { count: number; total: number }) {
  const tone = count > 0 ? 'bg-secondary text-brand-ink' : 'bg-page text-muted-foreground';
  return (
    <span className={cn('rounded-md px-2 text-xs font-semibold tabular-nums', tone)}>
      {count}/{total}
    </span>
  );
}

/** Two-pane picker: categories on the left (a row on mobile), the permissions of the open category on the right. */
export function PermissionPicker({ catalog, isLoading, selected, onToggle, onSelectAll }: Props) {
  const categories = groupPermissionsByCategory(catalog);
  const [current, setCurrent] = useState<string | null>(null);
  const active = categories.find((category) => category.category === current) ?? categories[0];

  if (isLoading) {
    return (
      <div role="status" aria-label="Đang tải danh mục quyền">
        <Skeleton className="h-72 w-full" rounded="lg" />
      </div>
    );
  }
  if (!active) return <p className="text-sm text-muted-foreground">Chưa có danh mục quyền.</p>;

  return (
    <Tabs
      orientation="vertical"
      value={active.category}
      onValueChange={(value) => setCurrent(String(value))}
      className="grid min-h-72 grid-cols-[13.75rem_minmax(0,1fr)] overflow-hidden rounded-xl border border-border max-sm:grid-cols-1"
    >
      <TabsList className={railClassName}>
        {categories.map((category) => (
          <TabsTrigger key={category.category} value={category.category} className={tabClassName}>
            <span>{category.label}</span>
            <CountPill
              count={category.permissions.filter((item) => selected.includes(item.code)).length}
              total={category.permissions.length}
            />
          </TabsTrigger>
        ))}
      </TabsList>
      {categories.map((category) => (
        <TabsContent key={category.category} value={category.category} className="mt-0 px-4 py-3.5">
          <PermissionCategoryGroup
            label={category.label}
            permissions={category.permissions}
            selected={selected}
            onToggle={onToggle}
            onSelectAll={onSelectAll}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
