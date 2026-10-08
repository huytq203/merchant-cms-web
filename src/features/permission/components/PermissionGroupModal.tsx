'use client';

import { FormModal } from '@/components/modal/FormModal';
import { usePermissionForm } from '../hooks/use-permission-form';
import type { PermissionCatalogItem, PermissionGroup, PermissionGroupFormValues } from '../schemas/permission-group.schema';
import { isDuplicateGroupCodeError } from '../utils/permission-group-code';
import { PermissionForm } from './PermissionForm';

const DUPLICATE_NAME_MESSAGE = 'Tên nhóm này đã được dùng. Hãy đặt tên khác.';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: PermissionCatalogItem[];
  catalogLoading?: boolean;
  group?: PermissionGroup | null;
  isSubmitting: boolean;
  error?: string;
  onSubmit: (values: PermissionGroupFormValues) => void;
}

function footerNote(count: number) {
  return count > 0 ? `Đã chọn ${count} quyền` : 'Chưa chọn quyền nào';
}

function PermissionGroupFormModal({ onOpenChange, catalog, catalogLoading, group, isSubmitting, error, onSubmit }: Omit<Props, 'open'>) {
  const form = usePermissionForm(group, onSubmit);
  const isEditing = Boolean(group);
  const duplicateName = !isEditing && isDuplicateGroupCodeError(error);

  return (
    <FormModal
      open
      onOpenChange={onOpenChange}
      size="lg"
      title={isEditing ? 'Cập nhật nhóm quyền' : 'Thêm nhóm quyền'}
      description="Đặt tên nhóm và chọn các quyền người dùng trong nhóm được làm."
      submitLabel="Lưu nhóm quyền"
      footerNote={footerNote(form.selected.length)}
      isSubmitting={isSubmitting}
      error={duplicateName ? undefined : error}
      onSubmit={form.submit}
    >
      <PermissionForm
        form={form}
        catalog={catalog}
        catalogLoading={catalogLoading}
        isEditing={isEditing}
        nameError={duplicateName ? DUPLICATE_NAME_MESSAGE : undefined}
      />
    </FormModal>
  );
}

/** Form state lives only while the modal is open, so each opening starts from the chosen group. */
export function PermissionGroupModal({ open, group, ...rest }: Props) {
  if (!open) return null;
  return <PermissionGroupFormModal key={group?.id ?? 'create'} group={group} {...rest} />;
}
