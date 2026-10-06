import { toast } from 'sonner';
import type { PermissionGroupFormValues } from '../schemas/permission-group.schema';
import type { PermissionGroupDialogs } from './use-permission-group-dialogs';
import {
  useCreatePermissionGroup,
  useDeletePermissionGroup,
  useUpdatePermissionGroup,
} from './use-permission-group-mutations';

/** Coordinates create/update/delete with the open dialog; failures stay visible in the dialog and as a toast. */
export function usePermissionGroupActions(dialogs: PermissionGroupDialogs) {
  const create = useCreatePermissionGroup();
  const update = useUpdatePermissionGroup();
  const remove = useDeletePermissionGroup();

  const save = async (values: PermissionGroupFormValues) => {
    try {
      if (dialogs.activeDialog === 'edit' && dialogs.target) {
        await update.mutateAsync({ id: dialogs.target.id, values });
      } else {
        await create.mutateAsync(values);
      }
      dialogs.close();
      toast.success('Lưu nhóm quyền thành công');
    } catch {
      toast.error('Không lưu được nhóm quyền');
    }
  };

  const confirmDelete = async () => {
    if (!dialogs.target) return;
    try {
      await remove.mutateAsync(dialogs.target.id);
      dialogs.close();
      toast.success('Xoá nhóm quyền thành công');
    } catch {
      toast.error('Không xoá được nhóm quyền');
    }
  };

  const closeDialog = () => {
    create.reset();
    update.reset();
    remove.reset();
    dialogs.close();
  };

  return {
    save,
    confirmDelete,
    closeDialog,
    isSaving: create.isPending || update.isPending,
    saveError: create.error?.message ?? update.error?.message,
    isDeleting: remove.isPending,
    deleteError: remove.error?.message,
  };
}
