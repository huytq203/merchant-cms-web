import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/session";
import { siteConfig } from "@/config/site";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSession();
  if (user) redirect(siteConfig.routes.dashboard);

  return (
    <div className="relative grid min-h-dvh lg:grid-cols-2">
      <aside
        className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:block"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,theme(colors.primary/25),transparent_55%),radial-gradient(ellipse_at_bottom_right,theme(colors.primary/15),transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground text-base font-semibold">
              B
            </div>
            <span className="text-sm font-semibold tracking-tight">
              {siteConfig.name}
            </span>
          </div>
          <div className="space-y-3">
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight">
              Vận hành thương gia,
              <br />
              tinh gọn và chủ động.
            </h1>
            <p className="max-w-md text-pretty text-sm text-sidebar-foreground/70">
              Quản lý đơn, sản phẩm, khách hàng và nhân sự trong một giao diện
              duy nhất. Nhanh, tập trung và rõ ràng.
            </p>
          </div>
          <p className="text-xs text-sidebar-foreground/50">
            © {new Date().getFullYear()} Beam
          </p>
        </div>
      </aside>
      <main className="flex min-h-dvh items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
