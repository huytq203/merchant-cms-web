'use client';
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuCollapsible,
  SidebarMenuSubItem,
  useSidebar,
  SidebarFooter,
  UserMenuPopover,
  UserMenuItem,
} from "@/components/ui/sidebar/Sidebar";
import { routesConfig } from "./constants/route.constants";
import { BadgeCheck, BellIcon, Loader2, LogOut, Sparkles } from "lucide-react";
import { useLogoutMutation } from "@/features/auth/hooks/use-logout-mutation";

const SideBar = () => {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { logout, isPending } = useLogoutMutation();
  const isCollapsed = state === "collapsed";
  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left" data-lenis-prevent>
      <SidebarHeader>
        <Link href="/blocks">
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
                  Flexpay
                </p>
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  Merchant CMS
                </p>
              </div>
            )}
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {routesConfig.map((route, idx) => {
          const isChildActive = route.items.some(
            (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
          );
          const shouldDefaultOpen = isChildActive || route.defaultOpen === true;

          return (
            <SidebarGroup key={idx}>
              {route.collapsible ? (
                <>
                  <SidebarGroupLabel>{route.title}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuCollapsible
                          id={route.title}
                          icon={
                            <span className="shrink-0 w-4 h-4 flex items-center justify-center">
                              {route.icon}
                            </span>
                          }
                          label={route.title}
                          defaultOpen={shouldDefaultOpen}
                          isChildActive={isChildActive}
                        >
                          {route.items.map((item, i) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                              <SidebarMenuSubItem key={i}>
                                <Link href={item.href}>
                                  <SidebarMenuButton
                                    isActive={isActive}
                                    tooltip={item.title}
                                    size="sm"
                                    className={cn(
                                      isActive &&
                                        "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
                                    )}
                                  >
                                    <span className="shrink-0 w-4 h-4 flex items-center justify-center">
                                      {item.icon}
                                    </span>
                                    <span className="truncate">{item.title}</span>
                                  </SidebarMenuButton>
                                </Link>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuCollapsible>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </>
              ) : (
                <>
                  <SidebarGroupLabel>{route.title}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {route.items.map((item, i) => {
                        const isActive = pathname === item.href;
                        return (
                          <SidebarMenuItem key={i}>
                            <Link href={item.href}>
                              <SidebarMenuButton
                                isActive={isActive}
                                tooltip={item.title}
                                size="sm"
                                className={cn(
                                  isActive &&
                                    "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
                                )}
                              >
                                <span className="shrink-0 w-4 h-4 flex items-center justify-center">
                                  {item.icon}
                                </span>
                                <span className="truncate">{item.title}</span>
                              </SidebarMenuButton>
                            </Link>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </>
              )}
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenuPopover
              name="admin2"
              email="admin@example.com"
              avatar="https://i.pravatar.cc/100"
            >
              <UserMenuItem icon={<Sparkles className="w-4 h-4" />}>
                Upgrade to Pro
              </UserMenuItem>
              <div className="h-px bg-border/50 my-1" />
              <UserMenuItem icon={<BadgeCheck className="w-4 h-4" />}>
                Account
              </UserMenuItem>
              <UserMenuItem icon={<BellIcon className="w-4 h-4" />}>
                Notifications
              </UserMenuItem>
              <div className="h-px bg-border/50 my-1" />
              <UserMenuItem
                icon={
                  isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )
                }
                destructive
                disabled={isPending}
                onClick={logout}
              >
                {isPending ? "Đang đăng xuất…" : "Log out"}
              </UserMenuItem>
            </UserMenuPopover>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SideBar;
