import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/login-form";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: `Đăng nhập vào ${siteConfig.name}`,
};

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Chào mừng trở lại
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight">
          Đăng nhập {siteConfig.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Sử dụng tài khoản thương gia để tiếp tục.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
