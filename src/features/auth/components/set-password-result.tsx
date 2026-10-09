"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { LOGIN_PATH } from "@/lib/auth/auth-routing";

/** The link cannot be used: expired, already used, or not an activation link at all. */
export function InvalidLinkNotice() {
  const router = useRouter();
  return (
    <section className="w-full max-w-sm space-y-5 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-warning/[0.16] text-warning">
        <LinkIcon className="size-7" aria-hidden />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Liên kết không dùng được</h1>
        <p className="text-sm text-muted-foreground">
          Liên kết đã hết hạn hoặc đã được dùng. Ở trang đăng nhập, chọn <b>Quên mật khẩu</b> để nhận liên kết mới.
        </p>
      </div>
      <Button type="button" size="lg" className="w-full" onClick={() => router.push(LOGIN_PATH)}>
        Về trang đăng nhập
      </Button>
    </section>
  );
}

export function PasswordSetNotice() {
  const router = useRouter();
  return (
    <section className="w-full max-w-sm space-y-5 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
        <CheckCircle2 className="size-7" aria-hidden />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Đã đặt mật khẩu</h1>
        <p className="text-sm text-muted-foreground">Bạn có thể đăng nhập bằng mật khẩu mới.</p>
      </div>
      <Button type="button" size="lg" className="w-full" onClick={() => router.replace(LOGIN_PATH)}>
        Đăng nhập
      </Button>
    </section>
  );
}
