"use client";

import { Lock } from "lucide-react";
import { FormModalField, FormModalGrid } from "@/components/modal/FormModalField";
import { Input } from "@/components/ui/input/Input";
import type { UserForm } from "../hooks/use-user-form";

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
            maxLength={255}
            autoComplete="off"
            disabled={readOnly}
            value={values.fullName}
            onChange={(event) => setField("fullName", event.target.value)}
          />
        )}
      </FormModalField>
      <FormModalField label="Số điện thoại" error={issues.phone}>
        {(control) => (
          <Input
            {...control}
            type="tel"
            placeholder="Ví dụ: 0912345678"
            autoComplete="off"
            disabled={readOnly}
            value={values.phone}
            onChange={(event) => setField("phone", event.target.value)}
          />
        )}
      </FormModalField>
    </FormModalGrid>
  );
}
