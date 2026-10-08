'use client';

import { FormModalField, FormModalGrid } from '@/components/modal/FormModalField';
import { Input } from '@/components/ui/input/Input';
import { Textarea } from '@/components/ui/textarea/Textarea';
import type { PermissionFormState } from '../hooks/use-permission-form';
import type { PermissionCatalogItem } from '../schemas/permission-group.schema';
import { PermissionPicker } from './PermissionPicker';

interface Props {
  form: PermissionFormState;
  catalog: PermissionCatalogItem[];
  catalogLoading?: boolean;
  isEditing: boolean;
  /** Error to show on the name field in addition to validation, for example a taken name. */
  nameError?: string;
}

function CodeHint({ code, isEditing }: { code: string; isEditing: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span>{isEditing ? 'Mã nhóm:' : 'Mã nhóm tự tạo:'}</span>
      <code className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-brand-ink">
        {code || 'TEN_NHOM'}
      </code>
    </span>
  );
}

function BasicFields({ form, isEditing, nameError }: Pick<Props, 'form' | 'isEditing' | 'nameError'>) {
  return (
    <FormModalGrid>
      <FormModalField
        label="Tên nhóm"
        required
        wide
        error={form.validation.name ?? nameError}
        hint={<CodeHint code={form.code} isEditing={isEditing} />}
      >
        {(control) => (
          <Input
            {...control}
            placeholder="Ví dụ: Quản trị merchant"
            maxLength={255}
            autoComplete="off"
            value={form.name}
            onChange={(event) => form.setName(event.target.value)}
          />
        )}
      </FormModalField>
      <FormModalField label="Mô tả" wide error={form.validation.description}>
        {(control) => (
          <Textarea
            {...control}
            rows={2}
            placeholder="Mô tả phạm vi quyền của nhóm"
            value={form.description}
            onChange={(event) => form.setDescription(event.target.value)}
          />
        )}
      </FormModalField>
    </FormModalGrid>
  );
}

function PermissionSection({ form, catalog, catalogLoading }: Omit<Props, 'isEditing' | 'nameError'>) {
  return (
    <section className="mt-5">
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Phân quyền chi tiết</h3>
        {catalogLoading ? null : (
          <span className="text-sm tabular-nums text-muted-foreground">
            Đã chọn {form.selected.length}/{catalog.length} quyền
          </span>
        )}
      </div>
      {form.validation.permissions ? (
        <p role="alert" className="mb-2 text-xs font-medium text-danger">
          {form.validation.permissions}
        </p>
      ) : null}
      <PermissionPicker
        catalog={catalog}
        isLoading={catalogLoading}
        selected={form.selected}
        onToggle={form.toggle}
        onSelectAll={form.selectAll}
      />
    </section>
  );
}

/** Body of the permission group modal: name, description and the permission picker. */
export function PermissionForm({ form, catalog, catalogLoading, isEditing, nameError }: Props) {
  return (
    <>
      <BasicFields form={form} isEditing={isEditing} nameError={nameError} />
      <PermissionSection form={form} catalog={catalog} catalogLoading={catalogLoading} />
    </>
  );
}
