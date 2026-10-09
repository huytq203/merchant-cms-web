import Image from "next/image";
import Link from "next/link";
import TealYellowLogo from "../../../../public/brand/logo-teal-yellow.webp";
import { cn } from "@/lib/utils/cn";

/** Logo xanh vàng ở đầu sidebar; khi thu gọn chỉ còn chữ F đầu của logo. */
export function SidebarBrand({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <Link href="/" aria-label="Flexpay Merchant Portal">
      <div className={cn("flex items-center gap-3 rounded-md px-2 py-2", isCollapsed && "justify-center")}>
        {isCollapsed ? (
          <span className="block h-8 w-8 flex-none overflow-hidden">
            <Image src={TealYellowLogo} alt="Flexpay" className="h-8 w-auto max-w-none" priority />
          </span>
        ) : (
          <div className="min-w-0">
            <Image src={TealYellowLogo} alt="Flexpay" className="h-8 w-auto" priority />
            <p className="mt-0.5 truncate text-xs leading-tight text-muted-foreground">Merchant Portal</p>
          </div>
        )}
      </div>
    </Link>
  );
}
