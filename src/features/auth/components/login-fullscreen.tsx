"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock } from "lucide-react";
import AppImage from "../../../../public/images/image.webp";
import EarthImage from "../../../../public/images/earth.png";
import { Form, FormField } from "@/components/ui/form/Form";
import { Input } from "@/components/ui/input/Input";
import { Button } from "@/components/ui/button/Button";
import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { useLoginMutation } from "@/features/auth/hooks/use-login-mutation";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { ForgotPasswordDialog } from "@/features/auth/components/forgot-password-dialog";
import Image from "next/image";
import LogoImage from "../../../../public/images/logo.png";

const DEFAULT_REDIRECT = "/dashboard";

function safeCallback(url: string | null): string {
  if (!url) return DEFAULT_REDIRECT;
  if (!url.startsWith("/") || url.startsWith("//")) return DEFAULT_REDIRECT;
  return url;
}

export function LoginFullScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallback(searchParams.get("callbackUrl"));

  const loginMutation = useLoginMutation();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = React.useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await loginMutation.mutateAsync(values);

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    router.replace(callbackUrl);
    router.refresh();
  });

  const busy = form.formState.isSubmitting || loginMutation.isPending;

  return (
    <div className="h-screen w-full flex">
      {/* Left: Color panel */}
      <div className="hidden md:flex w-[60%] flex-col justify-between p-12 bg-linear-to-br bg-primary/85 relative overflow-hidden">
        {/* 3 decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 -right-32 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute -bottom-16 left-1/4 w-56 h-56 bg-white/5 rounded-full" />

        {/* Earth overlay */}
        <div className="absolute -bottom-16 -right-20 w-[75%] aspect-square pointer-events-none select-none">
          <Image
            src={EarthImage}
            alt=""
            fill
            sizes="50vw"
            className="object-contain mix-blend-screen "
            aria-hidden
          />
        </div>

        {/* Logo Section */}
        <div className="relative flex items-center gap-5">
          <Image
            src={LogoImage}
            alt="Flexpay Logo"
            width={180}
            height={60}
            className="h-12 w-auto object-contain mb-2"
          />
          <div className="h-6 w-px bg-white/20" aria-hidden="true" />
          <span className="text-sm font-medium tracking-[0.2em] text-white/70 uppercase">
            Giải pháp thanh toán
          </span>
        </div>

        {/* App showcase */}
        <div className="relative flex flex-col items-center gap-6">
          {/* Ambient glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          </div>

          {/* Mockup image */}
          <div className="relative w-full max-w-[320px] lg:max-w-[420px] xl:max-w-[420px] 2xl:max-w-[600px] aspect-500/380 drop-shadow-[0_32px_48px_rgba(0,0,0,0.35)]">
            <Image
              src={AppImage}
              alt="Flexpay bảo vệ bạn"
              priority
              fill
              sizes="(max-width: 1023px) 320px, (max-width: 1279px) 420px, (max-width: 1535px) 420px, 600px"
              className="object-contain rounded-2xl"
            />
          </div>

          {/* Caption */}
          <div className="relative text-center space-y-2 max-w-[280px]">
            <p className="text-white text-lg font-semibold tracking-tight">
              Flexpay bảo vệ bạn
            </p>
            <p className="text-white/55 text-sm leading-relaxed">
              Bảo mật thông tin khách hàng luôn được đặt lên hàng đầu tại
              Flexpay.
            </p>
          </div>
        </div>

        <p className="relative text-white/30 text-xs">
          © 2026 Flexpay. All rights reserved.
        </p>
      </div>

      {/* Right: Form panel */}
      <div className="flex-1 flex flex-col bg-background overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between p-8">
          <div className="flex items-center gap-2 md:invisible">
            <Image
              src={LogoImage}
              alt="Flexpay Logo"
              width={180}
              height={60}
              className="h-12 w-auto object-contain mb-2"
            />
            {/* <div className="h-6 w-px bg-foreground/20" aria-hidden="true" />
            <span className="text-sm font-medium tracking-[0.2em] text-foreground uppercase">
              Giải pháp thanh toán
            </span> */}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-sm text-muted-foreground ml-auto"
          >
            Chưa có tài khoản?&nbsp;
            <span className="text-primary font-semibold">Đăng ký</span>
          </Button>
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center px-8 pb-12">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Chào mừng trở lại
              </h1>
              <p className="text-muted-foreground text-sm">
                Đăng nhập để tiếp tục sử dụng dịch vụ
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-5">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field, fieldState }) => (
                    <Input
                      label="Tên tài khoản"
                      type="text"
                      placeholder="admin1"
                      icon={<Mail className="w-4 h-4" />}
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
                      placeholder="••••••••"
                      icon={<Lock className="w-4 h-4" />}
                      error={fieldState.error?.message}
                      {...field}
                    />
                  )}
                />

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <Checkbox id="remember" label="Ghi nhớ đăng nhập" />
                  </div>
                  <Button
                    variant="link"
                    type="button"
                    className="px-0 text-sm"
                    onClick={() => setForgotPasswordOpen(true)}
                  >
                    Quên mật khẩu?
                  </Button>
                </div>

                {formError && (
                  <p
                    className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
                    role="alert"
                  >
                    {formError}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={busy}
                  disabled={busy}
                >
                  Đăng nhập
                </Button>

                {/* <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Hoặc tiếp tục với</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" type="button" className="w-full">Google</Button>
                  <Button variant="outline" type="button" className="w-full">GitHub</Button>
                </div> */}
              </form>
            </Form>
          </div>
        </div>
      </div>

      <ForgotPasswordDialog
        open={forgotPasswordOpen}
        onOpenChange={setForgotPasswordOpen}
      />
    </div>
  );
}
