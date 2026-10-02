import { Button } from "@/components/ui/button/Button";
import { logoutAction } from "@/features/auth/actions/logout-action";
import type { MerchantUserStatus } from "@/types/auth";

const COPY: Record<Exclude<MerchantUserStatus, "ACTIVE">, { title: string; body: string }> = {
  PENDING: {
    title: "Tài khoản chưa được kích hoạt",
    body: "Hãy hoàn tất kích hoạt qua email Flexpay đã gửi. Nếu chưa nhận được, liên hệ quản trị viên của đơn vị bạn.",
  },
  LOCKED: {
    title: "Tài khoản đã bị khóa",
    body: "Bạn không thể sử dụng Merchant Portal lúc này. Liên hệ quản trị viên của đơn vị để được mở khóa.",
  },
};

export function AccountStatusNotice({ status }: { status: Exclude<MerchantUserStatus, "ACTIVE"> }) {
  const copy = COPY[status];
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section className="w-full max-w-md space-y-4 text-center" role="alert">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.body}</p>
        <form action={logoutAction}>
          <Button type="submit" variant="outline">
            Đăng xuất
          </Button>
        </form>
      </section>
    </main>
  );
}
