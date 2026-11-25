"use client";

import { Lock } from "lucide-react";
import { FormModalField, FormModalGrid } from "@/components/modal/FormModalField";
import { Input } from "@/components/ui/input/Input";
import type { UserForm } from "../hooks/use-user-form";
import { normalizeFullName } from "../schemas/user.schema";

interface Props {
  form: UserForm;
  isEdit: boolean;
  /** Locks name and phone, used when the actor edits their own account. */
  readOnly: boolean;
  emailError?: string;
}

export function UserBasicFields({ form, isEdit, readOnly, emailError }: Props) {
  const { values, issues, setField } = form;

  return (
    <FormModalGrid>
      <FormModalField
        label="Email"
        required
        wide
        error={isEdit ? undefined : (emailError ?? issues.email)}
        hint={isEdit ? "Email là tên đăng nhập nên không đổi được." : undefined}
      >
        {(control) => (
          <Input
            {...control}
            type="email"
            placeholder="nguoidung@congty.vn"
            autoComplete="off"
            readOnly={isEdit}
            icon={isEdit ? <Lock className="h-4 w-4" aria-hidden="true" /> : undefined}
            className={isEdit ? "border-divider bg-accent font-medium text-foreground" : undefined}
            value={values.email}
            onChange={(event) => setField("email", event.target.value)}
          />
        )}
      </FormModalField>
      <FormModalField label="Họ và tên" required error={issues.fullName}>
        {(control) => (
          <Input
            {...control}
            placeholder="Ví dụ: Nguyễn Văn An"
            maxLength={100}
            autoComplete="off"
            disabled={readOnly}
            value={values.fullName}
            onChange={(event) => setField("fullName", event.target.value)}
            // Rời ô thì chuẩn hóa: bỏ khoảng trắng thừa và viết hoa chữ đầu mỗi từ.
            onBlur={() => setField("fullName", normalizeFullName(values.fullName))}
          />
        )}
      </FormModalField>
      {/* Sửa User cũ chưa có SĐT vẫn được để trống (giữ nguyên), nên chỉ đánh dấu bắt buộc khi tạo mới. */}
      <FormModalField label="Số điện thoại" required={!isEdit} error={issues.phone}>
        {(control) => (
          <Input
            {...control}
            type="tel"
            inputMode="numeric"
            maxLength={11}
            placeholder="Ví dụ: 0912345678"
            autoComplete="off"
            disabled={readOnly}
            value={values.phone}
            // Chỉ nhận chữ số (10-11 số) nên bỏ mọi ký tự khác ngay khi gõ hoặc dán.
            onChange={(event) => setField("phone", event.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
          />
        )}
      </FormModalField>
    </FormModalGrid>
  );
}
