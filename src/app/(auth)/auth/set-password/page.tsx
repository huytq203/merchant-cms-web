import type { Metadata } from "next";
import { checkSetPasswordLink } from "@/features/auth/actions/set-password-action";
import { SetPasswordFullScreen } from "@/features/auth/components/set-password-fullscreen";

export const metadata: Metadata = {
  title: "Đặt mật khẩu - Merchant Portal",
  description: "Đặt mật khẩu để kích hoạt hoặc khôi phục tài khoản Merchant Portal",
  robots: { index: false },
  // The link carries a one-time token: it must not leak through the Referer header.
  referrer: "no-referrer",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SetPasswordPage({ searchParams }: Props) {
  const raw = (await searchParams).token;
  const token = typeof raw === "string" ? raw : "";
  const link = await checkSetPasswordLink(token);
  return <SetPasswordFullScreen token={token} link={link} />;
}
