import type { Metadata } from "next";
import { ChangePasswordFullScreen } from "@/features/auth/components/change-password-fullscreen";

export const metadata: Metadata = {
  title: "Đổi mật khẩu - Merchant Portal",
  description: "Đổi mật khẩu tạm ở lần đăng nhập đầu tiên",
  robots: { index: false },
};

export default function ChangePasswordPage() {
  return <ChangePasswordFullScreen />;
}
