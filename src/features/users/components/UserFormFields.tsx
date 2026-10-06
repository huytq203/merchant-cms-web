"use client";

import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { Input } from "@/components/ui/input/Input";
import type { usePermissionGroups } from "@/features/permission/permission-group-queries";
import { useSubMerchantOptions } from "@/features/sub-merchants/hooks/use-sub-merchant-options";
import type { UserForm } from "../hooks/use-user-form";

type FieldProps = { form: UserForm };

export function UserBasicFields({ form, isEdit, emailError }: FieldProps & { isEdit: boolean; emailError?: string }) {
  const { values, issues, setField } = form;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {!isEdit && (
        <Input
          label="Email"
          placeholder="Ví dụ: ten@congty.vn"
          type="email"
          required
          value={values.email}
          error={emailError ?? issues.email}
          onChange={(event) => setField("email", event.target.value)}
        />
      )}
      <Input
        label="Họ và tên"
        placeholder="Ví dụ: Nguyễn Văn A"
        required
        value={values.fullName}
        error={issues.fullName}
        onChange={(event) => setField("fullName", event.target.value)}
      />
      <Input
        label="Số điện thoại"
        placeholder="Ví dụ: 0912345678"
        value={values.phone}
        error={issues.phone}
        onChange={(event) => setField("phone", event.target.value)}
      />
    </div>
  );
}

type GroupProps = FieldProps & {
  groups: ReturnType<typeof usePermissionGroups>;
  locked: boolean;
};

export function UserGroupFieldset({ form, groups, locked }: GroupProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">Nhóm quyền</legend>
      {groups.isPending && <p>Đang tải nhóm quyền...</p>}
      {groups.isError && <p role="alert">Không tải được nhóm quyền</p>}
      {groups.data?.rows.length === 0 && <p>Chưa có nhóm quyền</p>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {groups.data?.rows.map((group) => (
          <Checkbox
            key={group.id}
            label={group.name}
            checked={form.values.groupIds.includes(group.id)}
            disabled={locked}
            onCheckedChange={(checked) => form.toggle("groupIds", group.id, checked === true)}
          />
        ))}
      </div>
      {form.issues.groupIds && <p role="alert" className="text-sm text-danger">{form.issues.groupIds}</p>}
    </fieldset>
  );
}

function NewUserSubMerchantFieldset({ form }: FieldProps) {
  const subMerchants = useSubMerchantOptions();

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">Sub-merchant</legend>
      {subMerchants.isPending && <p>Đang tải sub-merchant...</p>}
      {subMerchants.isError && <p role="alert">Không tải được sub-merchant</p>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {subMerchants.data?.map((option) => (
          <Checkbox
            key={option.id}
            label={option.name}
            checked={form.values.subMerchantIds.includes(option.id)}
            onCheckedChange={(checked) => form.toggle("subMerchantIds", option.id, checked === true)}
          />
        ))}
      </div>
    </fieldset>
  );
}

export function UserSubMerchantFieldset({ form, isEdit }: FieldProps & { isEdit: boolean }) {
  if (isEdit) {
    return (
      <p className="text-sm text-muted-foreground">
        Phạm vi chỉ được xem trong đề xuất hiện có và không thể tạo mới tại đây.
      </p>
    );
  }
  return <NewUserSubMerchantFieldset form={form} />;
}
