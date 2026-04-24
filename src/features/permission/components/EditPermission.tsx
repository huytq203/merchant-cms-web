'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { AlertTriangle, Save, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormField,
  Input,
} from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import permissionData from '@/mock/data-permission.json';
import { editPermissionSchema, type EditPermissionFormValues } from '../schemas/schema';
import { useUpdatePermission } from '../hooks/use-permission-mutations';
import { PermissionCategoryGroup } from './PermissionCategoryGroup';

interface EditPermissionProps {
  id: string;
}

function formatAuditDate(dateStr: string) {
  try {
    return format(new Date(dateStr), 'HH:mm - dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

const EditPermission = ({ id }: EditPermissionProps) => {
  const router = useRouter();
  const group = permissionData.permissionGroups.find((g) => g.id === id);
  const { mutate: updatePermission, isPending } = useUpdatePermission(id);

  const form = useForm<EditPermissionFormValues>({
    resolver: zodResolver(editPermissionSchema),
    defaultValues: {
      name: group?.name ?? '',
      status: group?.status === 'active',
      permissions: group?.permissions ?? [],
    },
  });

  const selectedPermissions = form.watch('permissions');
  const statusValue = form.watch('status');
  const totalPermissions = permissionData.permissionCategories.reduce(
    (acc, cat) => acc + cat.permissions.length,
    0,
  );

  const handleTogglePermission = (permId: string) => {
    const current = form.getValues('permissions');
    const next = current.includes(permId)
      ? current.filter((p) => p !== permId)
      : [...current, permId];
    form.setValue('permissions', next, { shouldValidate: true });
  };

  const handleSelectAll = (categoryPermIds: string[]) => {
    const current = form.getValues('permissions');
    const allSelected = categoryPermIds.every((id) => current.includes(id));
    const next = allSelected
      ? current.filter((p) => !categoryPermIds.includes(p))
      : [...new Set([...current, ...categoryPermIds])];
    form.setValue('permissions', next, { shouldValidate: true });
  };

  const onSubmit = (values: EditPermissionFormValues) => {
    updatePermission(
      { name: values.name, status: values.status, permissions: values.permissions },
      { onSuccess: () => router.back() },
    );
  };

  if (!group) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Không tìm thấy nhóm quyền.
      </div>
    );
  }

  const userCount = (group as { userCount?: number }).userCount ?? 0;
  const permissionsError = form.formState.errors.permissions?.message;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cập nhật nhóm quyền</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Chỉnh sửa tên, trạng thái và các quyền truy cập.
            </p>
          </div>
        </div>
        <span className="rounded-lg bg-muted px-3 py-1.5 text-sm font-mono text-muted-foreground">
          Mã nhóm: #{id}
        </span>
      </div>

      {/* Warning if group has users */}
      {userCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/8 px-4 py-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
          <p className="text-sm text-warning-foreground">
            <span className="font-semibold">Lưu ý:</span> Nhóm quyền này đang có{' '}
            <span className="font-bold">{userCount} nhân viên</span> đang sử dụng. Mọi thay
            đổi về quyền sẽ có hiệu lực ngay lập tức với tất cả nhân viên trong nhóm.
          </p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Status toggle */}
          <Card>
            <CardContent className="pt-6">
              <FormField
                name="status"
                control={form.control}
                render={({ field }) => (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Trạng thái hoạt động</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Nếu tắt, toàn bộ nhân viên trong nhóm sẽ bị chặn truy cập.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={field.value}
                      onClick={() => field.onChange(!field.value)}
                      className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
                        field.value ? 'bg-success' : 'bg-muted-foreground/30',
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
                          field.value ? 'translate-x-6' : 'translate-x-1',
                        )}
                      />
                    </button>
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Tên nhóm quyền */}
          <Card>
            <CardContent className="pt-6">
              <FormField
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Input
                    label="Tên nhóm quyền"
                    placeholder="Ví dụ: Kế toán thanh toán, Nhân viên vận hành..."
                    required
                    error={fieldState.error?.message}
                    {...field}
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Phân quyền chi tiết */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle>
                  Điều chỉnh phân quyền <span className="text-destructive">*</span>
                </CardTitle>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold tabular-nums',
                    selectedPermissions.length === 0
                      ? 'bg-muted text-muted-foreground'
                      : selectedPermissions.length === totalPermissions
                        ? 'bg-success/15 text-success'
                        : 'bg-primary/10 text-primary',
                  )}
                >
                  {selectedPermissions.length}/{totalPermissions} quyền đã chọn
                </span>
              </div>
              {permissionsError && (
                <p className="text-xs font-medium text-danger mt-1">{permissionsError}</p>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {permissionData.permissionCategories.map((category, index) => (
                <PermissionCategoryGroup
                  key={category.id}
                  id={category.id}
                  name={category.name}
                  permissions={category.permissions}
                  selected={selectedPermissions}
                  onToggle={handleTogglePermission}
                  onSelectAll={handleSelectAll}
                  isFirst={index === 0}
                />
              ))}
            </CardContent>
          </Card>

          {/* Audit trail */}
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            <span>
              Khởi tạo bởi:{' '}
              <span className="font-medium text-foreground">{group.createdBy ?? '—'}</span>
              {group.createdAt && ` lúc ${formatAuditDate(group.createdAt)}`}
            </span>
            {group.updatedBy && group.updatedAt && (
              <>
                <span className="mx-2 text-border">|</span>
                <span>
                  Cập nhật lần cuối bởi:{' '}
                  <span className="font-medium text-foreground">{group.updatedBy}</span>
                  {` lúc ${formatAuditDate(group.updatedAt)}`}
                </span>
              </>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-3 pb-6">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              leftIcon={<Save className="h-4 w-4" />}
              isLoading={isPending}
            >
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditPermission;
