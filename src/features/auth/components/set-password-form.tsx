"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button/Button";
import { Form, FormField } from "@/components/ui/form/Form";
import { Input } from "@/components/ui/input/Input";
import { setPasswordSchema, type SetPasswordInput } from "@/features/auth/schemas";
import { PasswordChecklist } from "./password-checklist";

type Props = {
  maskedEmail: string | null;
  initialValues: SetPasswordInput | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (values: SetPasswordInput) => void;
};

export function SetPasswordForm({ maskedEmail, initialValues, isSubmitting, errorMessage, onSubmit }: Props) {
  const form = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: initialValues ?? { newPassword: "", confirmPassword: "" },
  });
  const password = useWatch({ control: form.control, name: "newPassword" });

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Đặt mật khẩu</h1>
        <p className="text-sm text-muted-foreground">
          {maskedEmail ? <>Tài khoản <b className="font-semibold text-foreground">{maskedEmail}</b>. </> : null}
          Sau bước này, bạn nhập mã OTP gửi về email để xác nhận.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field, fieldState }) => (
              <Input
                label="Mật khẩu mới"
                type="password"
                autoComplete="new-password"
                placeholder="Nhập mật khẩu mới"
                icon={<Lock className="size-4" />}
                error={fieldState.error?.message}
                {...field}
              />
            )}
          />
          <PasswordChecklist value={password} />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <Input
                label="Nhập lại mật khẩu"
                type="password"
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu mới"
                icon={<Lock className="size-4" />}
                error={fieldState.error?.message}
                {...field}
              />
            )}
          />
          {errorMessage ? (
            <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting} disabled={isSubmitting}>
            Tiếp tục
          </Button>
        </form>
      </Form>
    </div>
  );
}
