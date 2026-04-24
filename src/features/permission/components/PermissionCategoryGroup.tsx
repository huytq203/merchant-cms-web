'use client';
import { Checkbox } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

interface Permission {
  id: string;
  name: string;
}

interface PermissionCategoryGroupProps {
  id: string;
  name: string;
  permissions: Permission[];
  selected: string[];
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  isFirst?: boolean;
}

export function PermissionCategoryGroup({
  name,
  permissions,
  selected,
  onToggle,
  onSelectAll,
  isFirst,
}: PermissionCategoryGroupProps) {
  const permIds = permissions.map((p) => p.id);
  const selectedCount = permIds.filter((id) => selected.includes(id)).length;
  const allSelected = selectedCount === permIds.length;
  const someSelected = selectedCount > 0 && !allSelected;

  return (
    <div className={cn('border-b border-border last:border-b-0', !isFirst && '')}>
      {/* Category header */}
      <div
        className={cn(
          'flex items-center justify-between px-5 py-3 transition-colors',
          allSelected
            ? 'bg-success/8 border-l-2 border-l-success'
            : someSelected
              ? 'bg-primary/5 border-l-2 border-l-primary'
              : 'bg-muted/40 border-l-2 border-l-transparent',
        )}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            size="sm"
            checked={allSelected}
            indeterminate={someSelected}
            onCheckedChange={() => onSelectAll(permIds)}
          />
          <span className="text-sm font-semibold text-foreground">{name}</span>
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
              allSelected
                ? 'bg-success/15 text-success'
                : someSelected
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {selectedCount}/{permIds.length}
          </span>
        </div>
      </div>

      {/* Checkboxes grid */}
      <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {permissions.map((perm) => (
          <label
            key={perm.id}
            className={cn(
              'flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 text-sm transition-all',
              selected.includes(perm.id)
                ? 'border-primary/30 bg-primary/5 text-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-border/80 hover:bg-accent/30',
            )}
          >
            <Checkbox
              checked={selected.includes(perm.id)}
              onCheckedChange={() => onToggle(perm.id)}
              size="sm"
            />
            <span className={cn('font-medium', selected.includes(perm.id) && 'text-foreground')}>
              {perm.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
