'use client';

import { Checkbox } from '@/components/ui/checkbox/Checkbox';
import { permissionLabel } from '../constants/permission-labels';
import type { PermissionCatalogItem } from '../schemas/permission-group.schema';

interface Props {
  label: string;
  permissions: PermissionCatalogItem[];
  selected: string[];
  onToggle: (code: string) => void;
  onSelectAll: (codes: string[]) => void;
}

/** Permissions of one category: title, select-all and one plain row per permission. */
export function PermissionCategoryGroup({ label, permissions, selected, onToggle, onSelectAll }: Props) {
  const codes = permissions.map((permission) => permission.code);
  const selectedCount = codes.filter((code) => selected.includes(code)).length;
  const allSelected = selectedCount === codes.length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 border-b border-border pb-2.5">
        <h4 className="text-sm font-semibold text-foreground">{label}</h4>
        <Checkbox
          size="sm"
          label={allSelected ? 'Bỏ chọn' : 'Chọn tất cả'}
          checked={allSelected}
          indeterminate={selectedCount > 0 && !allSelected}
          onCheckedChange={() => onSelectAll(codes)}
        />
      </div>
      <ul className="grid grid-cols-1">
        {permissions.map((permission) => (
          <li key={permission.code} className="py-1.5">
            <Checkbox
              label={permissionLabel(permission.code)}
              checked={selected.includes(permission.code)}
              onCheckedChange={() => onToggle(permission.code)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
