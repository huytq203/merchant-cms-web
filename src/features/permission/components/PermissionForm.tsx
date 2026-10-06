'use client';

import { Input } from '@/components/ui/input/Input';
import { Textarea } from '@/components/ui/textarea/Textarea';
import { Button } from '@/components/ui/button/Button';
import { usePermissionForm } from '../hooks/use-permission-form';
import type {
  PermissionCatalogItem,
  PermissionGroup,
  PermissionGroupFormValues,
} from '../schemas/permission-group.schema';
import { groupPermissionsByCategory } from '../utils/permission-group-mapper';
import { PermissionCategoryGroup } from './PermissionCategoryGroup';

type Form = ReturnType<typeof usePermissionForm>;

function BasicFields({ form, isEditing }: { form: Form; isEditing: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Input
        label="Mã nhóm"
        placeholder="Ví dụ: MERCHANT_ADMIN"
        required
        value={form.code}
        disabled={isEditing}
        onChange={(event) => form.setCode(event.target.value)}
        error={form.validation.code}
      />
      <Input
        label="Tên nhóm"
        placeholder="Ví dụ: Quản trị merchant"
        required
        value={form.name}
        onChange={(event) => form.setName(event.target.value)}
        error={form.validation.name}
      />
      <div className="sm:col-span-2">
        <Textarea
          label="Mô tả"
          placeholder="Mô tả phạm vi quyền của nhóm"
          value={form.description}
          onChange={(event) => form.setDescription(event.target.value)}
          error={form.validation.description}
        />
      </div>
    </div>
  );
}

function PermissionSelector({ form, catalog }: { form: Form; catalog: PermissionCatalogItem[] }) {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-foreground">Phân quyền chi tiết</h2>
      {catalog.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có danh mục quyền.</p>
      ) : null}
      {groupPermissionsByCategory(catalog).map((category) => (
        <PermissionCategoryGroup
          key={category.category}
          label={category.label}
          permissions={category.permissions}
          selected={form.selected}
          onToggle={form.toggle}
          onSelectAll={form.selectAll}
        />
      ))}
      {form.validation.permissions ? (
        <p role="alert" className="text-sm text-danger">
          {form.validation.permissions}
        </p>
      ) : null}
    </div>
  );
}

interface Props {
  catalog: PermissionCatalogItem[];
  group?: PermissionGroup | null;
  isSubmitting: boolean;
  error?: string;
  onSubmit: (values: PermissionGroupFormValues) => void;
  onCancel: () => void;
}

export function PermissionForm({ catalog, group, isSubmitting, error, onSubmit, onCancel }: Props) {
  const form = usePermissionForm(group, onSubmit);

  return (
    <form onSubmit={form.submit} className="space-y-5">
      <BasicFields form={form} isEditing={Boolean(group)} />
      <PermissionSelector form={form} catalog={catalog} />
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Huỷ
        </Button>
        <Button type="submit" variant="solid" disabled={isSubmitting}>
          Lưu nhóm quyền
        </Button>
      </div>
    </form>
  );
}
