import Image from "next/image";
import Link from "next/link";
import TealYellowLogo from "../../../../public/brand/logo-teal-yellow.webp";
import { cn } from "@/lib/utils/cn";

/**
 * Logo xanh vàng và tên cổng, cùng một hàng, cao bằng thanh trên cùng.
 * Khi thu gọn chỉ còn chữ F đầu của logo.
 */
export function SidebarBrand({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Flexpay Merchant Portal"
      className={cn("flex items-center gap-3 rounded-md", isCollapsed && "justify-center")}
    >
      {isCollapsed ? (
        <span className="block h-6 w-[22px] flex-none overflow-hidden">
          <Image src={TealYellowLogo} alt="Flexpay" className="h-6 w-auto max-w-none" priority />
        </span>
      ) : (
        <>
          <Image src={TealYellowLogo} alt="Flexpay" className="h-6 w-auto flex-none" priority />
          <span aria-hidden="true" className="h-4 w-px flex-none bg-border" />
          <span className="truncate text-xs font-medium text-muted-foreground">
            Merchant Portal
          </span>
        </>
      )}
    </Link>
  );
}
