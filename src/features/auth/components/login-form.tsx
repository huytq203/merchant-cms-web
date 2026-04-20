"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/shared/ui/button";
import { Field } from "@/components/shared/ui/field";
import { Input } from "@/components/shared/ui/input";
import { useLoginMutation } from "@/features/auth/hooks/use-login-mutation";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";

const DEFAULT_REDIRECT = "/dashboard";

function safeCallback(url: string | null): string {
  if (!url) return DEFAULT_REDIRECT;
  if (!url.startsWith("/") || url.startsWith("//")) return DEFAULT_REDIRECT;
  return url;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallback(searchParams.get("callbackUrl"));

  const loginMutation = useLoginMutation();
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await loginMutation.mutateAsync(values);

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    router.replace(callbackUrl);
    router.refresh();
  });

  const busy = isSubmitting || loginMutation.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <Field
        label="Tên tài khoản"
        htmlFor="username"
        error={errors.username?.message}
      >
        <Input
          id="username"
          type="text"
          autoComplete="username"
          placeholder="admin1"
          aria-invalid={!!errors.username}
          {...register("username")}
        />
      </Field>

      <Field
        label="Mật khẩu"
        htmlFor="password"
        error={errors.password?.message}
      >
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </Field>

      {formError ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden />
            Đang đăng nhập…
          </>
        ) : (
          "Đăng nhập"
        )}
      </Button>
    </form>
  );
}
