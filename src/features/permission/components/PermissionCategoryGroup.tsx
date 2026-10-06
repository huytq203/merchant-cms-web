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

export function PermissionCategoryGroup({ label, permissions, selected, onToggle, onSelectAll }: Props) {
  const codes = permissions.map((permission) => permission.code);
  const selectedCount = codes.filter((code) => selected.includes(code)).length;

  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-foreground">{label}</h3>
        <Checkbox
          label="Chọn tất cả"
          checked={selectedCount === codes.length}
          indeterminate={selectedCount > 0 && selectedCount < codes.length}
          onCheckedChange={() => onSelectAll(codes)}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {permissions.map((permission) => (
          <div key={permission.code} className="rounded-lg border border-border p-2">
            <Checkbox
              label={permissionLabel(permission.code)}
              checked={selected.includes(permission.code)}
              onCheckedChange={() => onToggle(permission.code)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
