"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button/Button";
import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { Form, FormField } from "@/components/ui/form/Form";
import { Input } from "@/components/ui/input/Input";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";

interface CredentialsStepProps {
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (values: LoginInput) => void;
  onForgotPassword: () => void;
}

export function CredentialsStep({
  isSubmitting,
  errorMessage,
  onSubmit,
  onForgotPassword,
}: CredentialsStepProps) {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Chào mừng trở lại</h1>
        <p className="text-sm text-muted-foreground">Đăng nhập để tiếp tục sử dụng dịch vụ</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Input
                label="Email"
                type="email"
                autoComplete="username"
                placeholder="Ví dụ: ten@congty.vn"
                icon={<Mail className="size-4" />}
                error={fieldState.error?.message}
                {...field}
              />
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Input
                label="Mật khẩu"
                type="password"
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                icon={<Lock className="size-4" />}
                error={fieldState.error?.message}
                {...field}
              />
            )}
          />

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Checkbox id="remember" label="Ghi nhớ đăng nhập" />
            </div>
            <Button variant="link" type="button" className="px-0 text-sm" onClick={onForgotPassword}>
              Quên mật khẩu?
            </Button>
          </div>

          {errorMessage && (
            <p
              className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {errorMessage}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting} disabled={isSubmitting}>
            Đăng nhập
          </Button>
        </form>
      </Form>
    </div>
  );
}
