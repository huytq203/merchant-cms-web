"use client";

import { Button, ComboBox, Input } from "@/components/ui";
import React from "react";
import { usePermissions } from "../hooks/use-permissions";
import {
  Control,
  Controller,
  useForm,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormReset,
} from "react-hook-form";

export interface UserFilterValues {
  name: string;
  status: string;
  permissionGroupId: string;
}

interface UserFilterProps {
  onFilter: (values: UserFilterValues) => void;
  handleClear: () => void;
  permissionOptions: { label: string; value: string }[];
  register: UseFormRegister<UserFilterValues>;
  handleSubmit: UseFormHandleSubmit<UserFilterValues>;
  reset: UseFormReset<UserFilterValues>;
  control: Control<UserFilterValues>;
}

const STATUS_OPTIONS = [
  { label: "Hoạt động", value: "active" },
  { label: "Không hoạt động", value: "inactive" },
  { label: "Bị khóa", value: "locked" },
];

const UserFilter = ({
  onFilter,
  handleClear,
  permissionOptions,
  register,
  handleSubmit,
  control,
}: UserFilterProps) => {
  return (
    <form onSubmit={handleSubmit(onFilter)}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Họ tên hoặc Email"
            placeholder="Nhập tên hoặc email"
            {...register("name")}
          />
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <ComboBox
                label="Trạng thái"
                placeholder="----Chọn trạng thái----"
                options={STATUS_OPTIONS}
                value={field.value}
                onChange={(val) =>
                  field.onChange(typeof val === "string" ? val : (val[0] ?? ""))
                }
              />
            )}
          />
          <Controller
            name="permissionGroupId"
            control={control}
            render={({ field }) => (
              <ComboBox
                label="Nhóm quyền"
                placeholder="----Chọn nhóm quyền----"
                options={permissionOptions}
                value={field.value}
                onChange={(val) =>
                  field.onChange(typeof val === "string" ? val : (val[0] ?? ""))
                }
              />
            )}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="solid">
            Tìm kiếm
          </Button>
          <Button type="button" variant="outline" onClick={handleClear}>
            Xóa bộ lọc
          </Button>
        </div>
      </div>
    </form>
  );
};

export default UserFilter;
