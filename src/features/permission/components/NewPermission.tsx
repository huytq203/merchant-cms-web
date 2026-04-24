'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck } from 'lucide-react';
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
import permissionData from '@/mock/data-permission.json';
import { newPermissionSchema, type NewPermissionFormValues } from '../schemas/schema';
import { PermissionCategoryGroup } from './PermissionCategoryGroup';

const DEFAULT_VALUES: NewPermissionFormValues = { name: '', permissions: [] };

const NewPermission = () => {
  const router = useRouter();
  const form = useForm<NewPermissionFormValues>({
    resolver: zodResolver(newPermissionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const selectedPermissions = form.watch('permissions');
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

  const onSubmit = (values: NewPermissionFormValues) => {
    console.log('Submit:', values);
    // TODO: gọi API tạo nhóm quyền
    router.back();
  };

  const permissionsError = form.formState.errors.permissions?.message;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Thiết lập nhóm quyền mới</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Định nghĩa tên và các quyền truy cập cho nhóm quyền này.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                  Phân quyền chi tiết{' '}
                  <span className="text-destructive">*</span>
                </CardTitle>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold tabular-nums ${
                    selectedPermissions.length === 0
                      ? 'bg-muted text-muted-foreground'
                      : selectedPermissions.length === totalPermissions
                        ? 'bg-success/15 text-success'
                        : 'bg-primary/10 text-primary'
                  }`}
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

          {/* Footer actions */}
          <div className="flex justify-end gap-3 pb-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" leftIcon={<ShieldCheck className="h-4 w-4" />}>
              Lưu nhóm quyền
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewPermission;
