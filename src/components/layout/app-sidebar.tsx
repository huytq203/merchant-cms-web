"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { primaryNav, siteConfig, type NavItem } from "@/config/site";
import { useUIStore } from "@/stores/ui-store";

const iconMap: Record<NavItem["icon"], LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  products: Package,
  orders: Receipt,
  settings: Settings,
};

export function AppSidebar() {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-64",
      )}
      aria-label="Điều hướng chính"
    >
      <div className="flex h-16 items-center gap-2 px-4">
        <div
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground text-sm font-semibold"
          aria-hidden
        >
          B
        </div>
        {!collapsed ? (
          <span className="truncate text-sm font-semibold tracking-tight">
            {siteConfig.name}
          </span>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {primaryNav.map((item) => {
          const Icon = iconMap[item.icon];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80",
                collapsed && "justify-center",
              )}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.title : undefined}
            >
              <Icon className="size-4" aria-hidden />
              {!collapsed ? <span className="truncate">{item.title}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3 text-xs text-sidebar-foreground/60">
        {!collapsed ? <span>v0.1.0 · Beam CMS</span> : <span>·</span>}
      </div>
    </aside>
  );
}
