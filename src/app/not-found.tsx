import Link from "next/link";

import { Button } from "@/components/shared/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          404
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">
          Không tìm thấy trang
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Đường dẫn bạn truy cập không tồn tại hoặc đã bị di chuyển.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Về trang chủ</Link>
        </Button>
      </div>
    </div>
  );
}
