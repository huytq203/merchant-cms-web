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

/**
 * BE chỉ cho cấp quyền mà người đang đăng nhập có (`grantable=false` là chưa có). Quyền như vậy không tick
 * thêm được; nếu nhóm đang có sẵn thì vẫn bỏ tick được.
 */
function isLocked(permission: PermissionCatalogItem, checked: boolean): boolean {
  return permission.grantable === false && !checked;
}

/** Permissions of one category: title, select-all and one plain row per permission. */
export function PermissionCategoryGroup({ label, permissions, selected, onToggle, onSelectAll }: Props) {
  // "Chọn tất cả" chỉ tính các quyền được phép cấp, để không gửi lên quyền BE sẽ từ chối.
  const codes = permissions.filter((permission) => permission.grantable !== false).map((permission) => permission.code);
  const selectedCount = codes.filter((code) => selected.includes(code)).length;
  const allSelected = codes.length > 0 && selectedCount === codes.length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 border-b border-border pb-2.5">
        <h4 className="text-sm font-semibold text-foreground">{label}</h4>
        <Checkbox
          size="sm"
          label={allSelected ? 'Bỏ chọn' : 'Chọn tất cả'}
          checked={allSelected}
          indeterminate={selectedCount > 0 && !allSelected}
          disabled={codes.length === 0}
          onCheckedChange={() => onSelectAll(codes)}
        />
      </div>
      <ul className="grid grid-cols-1">
        {permissions.map((permission) => {
          const checked = selected.includes(permission.code);
          const locked = isLocked(permission, checked);
          return (
            <li key={permission.code} className="flex items-center justify-between gap-3 py-1.5">
              <Checkbox
                label={permissionLabel(permission.code)}
                checked={checked}
                disabled={locked}
                onCheckedChange={() => onToggle(permission.code)}
              />
              {permission.grantable === false ? (
                <span className="shrink-0 text-xs text-muted-foreground">Bạn chưa có quyền này</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
