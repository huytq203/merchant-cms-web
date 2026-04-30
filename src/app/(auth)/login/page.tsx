import type { Metadata } from "next";
import { LoginFullScreen } from "@/features/auth/components/login-fullscreen";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào hệ thống quản lý thương gia",
};

export default function LoginPage() {
  return <LoginFullScreen />;
}
