import Link from "next/link";

import { Button } from "@/components/ui/button/Button";

/** Shown inside the CMS shell when the signed-in user lacks the permission a page requires. */
export function AccessDenied() {
  return (
    <section className="grid place-items-center py-24" aria-labelledby="access-denied-title">
      <div className="max-w-md text-center">
        <h1 id="access-denied-title" className="text-2xl font-semibold tracking-tight text-foreground">
          Bạn không có quyền truy cập
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Tài khoản của bạn chưa được cấp quyền xem trang này. Liên hệ quản trị viên của đơn vị nếu cần.
        </p>
        <Button
          className="mt-6"
          variant="solid"
          nativeButton={false}
          render={<Link href="/dashboard" role="link" />}
        >
          Về trang chủ
        </Button>
      </div>
    </section>
  );
}
