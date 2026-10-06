import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/** Logo và tên sản phẩm ở đầu sidebar; ẩn chữ khi sidebar thu gọn. */
export function SidebarBrand({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <Link href="/">
      <div
        className={cn(
          "flex items-center gap-3 px-2 py-2 rounded-md transition-all duration-200",
          isCollapsed && "justify-center",
        )}
      >
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0 shadow-sm flex-none">
          <span className="text-primary-foreground font-bold text-sm select-none">
            FP
          </span>
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">
              FlexPay
            </p>
            <p className="text-xs text-muted-foreground truncate leading-tight">
              Merchant Admin CMS
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
