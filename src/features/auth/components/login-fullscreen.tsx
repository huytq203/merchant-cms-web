"use client";

import * as React from "react";

import { ForgotPasswordDialog } from "@/features/auth/components/forgot-password-dialog";
import { LoginBrandPanel } from "@/features/auth/components/login-brand-panel";
import { LoginFormPanel } from "@/features/auth/components/login-form-panel";

export function LoginFullScreen() {
  const [forgotPasswordOpen, setForgotPasswordOpen] = React.useState(false);

  return (
    <div className="flex h-screen w-full">
      <LoginBrandPanel />
      <LoginFormPanel onForgotPassword={() => setForgotPasswordOpen(true)} />
      <ForgotPasswordDialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen} />
    </div>
  );
}
