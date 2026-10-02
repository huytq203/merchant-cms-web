"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormField,
  Input,
  Switch,
  Text,
} from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import {
  newPermissionSchema,
  editPermissionSchema,
  type EditPermissionFormValues,
  type NewPermissionFormValues,
} from "../schemas/schema";
import {
  useUpdatePermission,
  useCreatePermission,
} from "../hooks/use-permission-mutations";
import { PermissionCategoryGroup } from "./PermissionCategoryGroup";
import { usePermissionDetailQuery } from "../hooks/use-permission-query";
import { useEffect } from "react";
import { usePermissions } from "@/features/users/hooks/use-permissions";

interface PermissionFormProps {
  mode: "create" | "edit";
  id?: string;
}

const DEFAULT_VALUES: NewPermissionFormValues = { name: "", permissions: [] };

const PermissionForm = ({ mode, id = "" }: PermissionFormProps) => {
  const router = useRouter();
  const isEdit = mode === "edit";

  const { data, isLoading: isLoadingData } = usePermissionDetailQuery(
    isEdit ? id : "",
  );
  const { mutate: updatePermission, isPending: isUpdating } =
    useUpdatePermission(id);
  const { mutate: createPermission, isPending: isCreating } =
    useCreatePermission();
  const { data: permissionData } = usePermissions();
  const schema = isEdit ? editPermissionSchema : newPermissionSchema;

  const formDefaultValues = isEdit
    ? {
        name: data?.name ?? "",
        status: data?.status ?? "inactive",
        permissions: data?.permissions ?? [],
      }
    : DEFAULT_VALUES;

  const form = useForm<EditPermissionFormValues | NewPermissionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: formDefaultValues as EditPermissionFormValues &
      NewPermissionFormValues,
  });

  useEffect(() => {
    if (data && isEdit) {
      form.reset({
        name: data.name,
        status: (data.status ?? "inactive") as "active" | "inactive",
        permissions: data.permissions,
      });
    }
  }, [data, isEdit, form]);

  // eslint-disable-next-line react-hooks/incompatible-library -- dự án chưa bật React Compiler, không ảnh hưởng
  const selectedPermissions = form.watch("permissions");

  const totalPermissions = permissionData?.data.reduce(
    (acc, cat) => acc + cat.permissions.length,
    0,
  );

  const handleTogglePermission = (permId: string) => {
    const current = form.getValues("permissions");
    const next = current.includes(permId)
      ? current.filter((p) => p !== permId)
      : [...current, permId];
    form.setValue("permissions", next, { shouldValidate: true });
  };

  const handleSelectAll = (categoryPermIds: string[]) => {
    const current = form.getValues("permissions");
    const allSelected = categoryPermIds.every((id) => current.includes(id));
    const next = allSelected
      ? current.filter((p) => !categoryPermIds.includes(p))
      : [...new Set([...current, ...categoryPermIds])];
    form.setValue("permissions", next, { shouldValidate: true });
  };

  const onSubmit = (
    values: EditPermissionFormValues | NewPermissionFormValues,
  ) => {
    if (isEdit) {
      const editValues = values as EditPermissionFormValues;
      updatePermission(
        {
          name: editValues.name,
          status: editValues.status,
          permissions: editValues.permissions,
        },
        { onSuccess: () => router.back() },
      );
    } else {
      const createValues = values as NewPermissionFormValues;
      createPermission(createValues, {
        onSuccess: () => router.back(),
      });
    }
  };

  if (isEdit && isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Đang tải...
      </div>
    );
  }

  if (isEdit && !data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Không tìm thấy nhóm quyền.
      </div>
    );
  }

  const userCount = (data as { userCount?: number })?.userCount ?? 0;
  const permissionsError = form.formState.errors.permissions?.message;
  const isPending = isUpdating || isCreating || isLoadingData;

  const pageTitle = isEdit ? "Cập nhật nhóm quyền" : "Thiết lập nhóm quyền mới";
  const pageDesc = isEdit
    ? "Chỉnh sửa tên, trạng thái và các quyền truy cập."
    : "Định nghĩa tên và các quyền truy cập cho nhóm quyền này.";
  const submitLabel = isEdit ? "Cập nhật" : "Lưu nhóm quyền";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{pageDesc}</p>
          </div>
        </div>
        {isEdit && (
          <span className="rounded-lg bg-muted px-3 py-1.5 text-sm font-mono text-muted-foreground">
            Mã nhóm: #{id}
          </span>
        )}
      </div>

      {/* Warning if group has users (edit mode only) */}
      {isEdit && userCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/8 px-4 py-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
          <p className="text-sm text-warning">
            <span className="font-semibold">Lưu ý:</span> Nhóm quyền này đang có{" "}
            <span className="font-bold">{userCount} nhân viên</span> đang sử
            dụng. Mọi thay đổi về quyền sẽ có hiệu lực ngay lập tức với tất cả
            nhân viên trong nhóm.
          </p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Status toggle (edit mode only) */}
          {isEdit && (
            <Card>
              <CardContent className="pt-6">
                <FormField
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Trạng thái hoạt động
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Nếu tắt, toàn bộ nhân viên trong nhóm sẽ bị chặn truy
                          cập.
                        </p>
                      </div>
                      <Switch
                        checked={field.value === "active"}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? "active" : "inactive")
                        }
                        size="md"
                      />
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          )}

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
                  Điều chỉnh phân quyền{" "}
                  <span className="text-destructive">*</span>
                </CardTitle>
                <Text
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold tabular-nums",
                    selectedPermissions.length === 0
                      ? "bg-muted text-muted-foreground"
                      : selectedPermissions.length === totalPermissions
                        ? "bg-success/15 text-success"
                        : "bg-primary/10 text-primary",
                  )}
                >
                  {selectedPermissions.length}/{totalPermissions} quyền đã chọn
                </Text>
              </div>
              {permissionsError && (
                <p className="text-xs font-medium text-danger mt-1">
                  {permissionsError}
                </p>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {permissionData?.data.map((category, index) => (
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
              disabled={isPending}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              leftIcon={<ShieldCheck className="h-4 w-4" />}
              disabled={isPending}
            >
              {submitLabel}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PermissionForm;
