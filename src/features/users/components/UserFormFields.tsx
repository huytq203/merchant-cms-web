"use client";

import { FormField, FormItem, FormControl, FormMessage, FormDescription } from "@/components/ui/form/Form";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { Control } from "react-hook-form";
import { FormUserValues } from "../schemas/form-user.schema";

interface PermissionOption {
  label: string;
  value: string;
}

interface UserFormFieldsProps {
  control: Control<FormUserValues>;
  permissionOptions: PermissionOption[];
  isPermissionsLoading: boolean;
}

export function UserFormFields({
  control,
  permissionOptions,
  isPermissionsLoading,
}: UserFormFieldsProps) {
  return (
    <>
      {/* Họ và tên + Số điện thoại */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <Input
                  label="Họ và tên"
                  required
                  placeholder="Nguyễn Văn A"
                  {...field}
                  error={fieldState.error?.message}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="phone"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <Input
                  label="Số điện thoại"
                  required
                  placeholder="0912xxxxxx"
                  {...field}
                  error={fieldState.error?.message}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Email */}
      <FormField
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormControl>
              <Input
                type="email"
                label="Email đăng nhập (Tên tài khoản)"
                required
                placeholder="email@merchant.com"
                {...field}
                error={fieldState.error?.message}
              />
            </FormControl>
            <FormDescription>
              Mật khẩu khởi tạo sẽ được gửi với email này.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Nhóm quyền */}
      <FormField
        control={control}
        name="permissionGroupId"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormControl>
              <Select
                label="Nhóm quyền (Vai trò)"
                required
                placeholder="-- Chọn nhóm quyền --"
                options={permissionOptions}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                disabled={isPermissionsLoading}
                emptyText={
                  isPermissionsLoading
                    ? "Đang tải..."
                    : "Không có nhóm quyền nào"
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
