"use client";

import Image from "next/image";
import { ArrowLeft } from "lucide-react";

import TealLogo from "../../../../public/brand/logo-teal-yellow.webp";
import { Button } from "@/components/ui/button/Button";
import { LoginBrandPanel } from "@/features/auth/components/login-brand-panel";
import { SetPasswordForm } from "@/features/auth/components/set-password-form";
import { useChangePasswordFlow } from "@/features/auth/hooks/use-change-password-flow";

/**
 * Forced change of a temporary password, shown after the login OTP. It uses the login page frame
 * (no menu, no header links) and the user holds no session yet, so no other page is reachable from here.
 */
export function ChangePasswordFullScreen() {
  const flow = useChangePasswordFlow();

  return (
    <div className="flex h-screen w-full">
      <LoginBrandPanel />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-background md:min-w-[22rem]">
        <header className="flex flex-col gap-2 px-6 pt-6">
          <Image src={TealLogo} alt="Flexpay" width={720} height={212} className="mx-auto h-10 w-auto md:hidden" priority />
          <div className="flex min-h-9 items-center">
            <Button type="button" variant="ghost" size="sm" leftIcon={<ArrowLeft className="size-4" aria-hidden />} onClick={flow.backToLogin}>
              Quay lại đăng nhập
            </Button>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          {flow.ready ? (
            <SetPasswordForm
              maskedEmail={null}
              initialValues={null}
              title="Đổi mật khẩu"
              intro="Bạn đang dùng mật khẩu tạm. Hãy đặt mật khẩu mới để tiếp tục sử dụng Merchant Portal."
              submitLabel="Đổi mật khẩu"
              isSubmitting={flow.isSubmitting}
              errorMessage={flow.error}
              onSubmit={(values) => void flow.submit(values)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
