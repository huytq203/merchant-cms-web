import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { SidebarMenuButton } from "@/components/ui/sidebar/Sidebar";
import { Badge } from "@/components/ui/badge/Badge";
import type { SidebarItem } from "./constants/route.constants";

interface SidebarNavLinkProps {
  item: SidebarItem;
  isActive: boolean;
  size?: "sm";
}

/** Một mục menu: liên kết, icon, tiêu đề và badge. */
export function SidebarNavLink({ item, isActive, size }: SidebarNavLinkProps) {
  return (
    <Link href={item.href} className="w-full text-foreground">
      <SidebarMenuButton
        isActive={isActive}
        tooltip={item.title}
        size={size}
        className={cn(
          isActive &&
            "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
        )}
      >
        {item.icon && (
          <span className="shrink-0 w-4 h-4 flex items-center justify-center">
            {item.icon}
          </span>
        )}
        <span className="truncate">{item.title}</span>
        {item.badge && (
          <Badge size="sm" variant="soft-primary" className=" ml-auto ">
            {item.badge}
          </Badge>
        )}
      </SidebarMenuButton>
    </Link>
  );
}
