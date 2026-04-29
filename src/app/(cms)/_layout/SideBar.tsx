"use client";

import { useState } from "react";
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
import { Separator } from "@/components/ui/separator/Separator";
import { routesConfig } from "./constants/route.constants";
import { Badge } from "@/components/ui/badge/Badge";
import { BadgeCheck, BellIcon, LogOut } from "lucide-react";
import { useSessionQuery } from "@/features/auth/hooks/use-session-query";
import { useLogoutMutation } from "@/features/auth/hooks/use-logout-mutation";
import { AccountDialog } from "@/features/account/components/AccountDialog";

export default function DocSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const { logout, isPending: isLoggingOut } = useLogoutMutation();
  const [accountOpen, setAccountOpen] = useState(false);
  const { data: session } = useSessionQuery();
  const displayName = session?.username ?? "";
  const displayEmail = session?.email ?? "";

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        {/* Logo */}
        <SidebarHeader className="">
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
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent>
          {routesConfig.map((section) => {
            const isChildActive = section.items.some(
              (item) =>
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`),
            );
            const shouldDefaultOpen =
              isChildActive || section.defaultOpen === true;

            return (
              <SidebarGroup key={section.title}>
                {section.collapsible ? (
                  <>
                    <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem className="">
                          <SidebarMenuCollapsible
                            id={section.title}
                            icon={
                              <span className="shrink-0 w-4 h-4 flex items-center justify-center">
                                {section?.icon}
                              </span>
                            }
                            label={section.title}
                            defaultOpen={shouldDefaultOpen}
                            isChildActive={isChildActive}
                          >
                            {section.items.map((item) => {
                              const isActive =
                                pathname === item.href ||
                                pathname.startsWith(`${item.href}/`);
                              return (
                                <SidebarMenuSubItem key={item.href}>
                                  <Link
                                    href={item.href}
                                    className="w-full text-foreground"
                                  >
                                    <SidebarMenuButton
                                      isActive={isActive}
                                      tooltip={item.title}
                                      size="sm"
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
                                      <span className="truncate">
                                        {item.title}
                                      </span>
                                      {item.badge && (
                                        <Badge
                                          size="sm"
                                          variant="soft-primary"
                                          className=" ml-auto "
                                        >
                                          {item.badge}
                                        </Badge>
                                      )}
                                    </SidebarMenuButton>
                                  </Link>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuCollapsible>
                          <Separator className="mt-2" />
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </>
                ) : (
                  <>
                    <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {section.items.map((item) => {
                          const isActive =
                            pathname === item.href ||
                            pathname.startsWith(`${item.href}/`);
                          return (
                            <SidebarMenuItem key={item.href}>
                              <Link
                                href={item.href}
                                className="w-full text-foreground"
                              >
                                <SidebarMenuButton
                                  isActive={isActive}
                                  tooltip={item.title}
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
                                    <Badge
                                      size="sm"
                                      variant="soft-primary"
                                      className=" ml-auto "
                                    >
                                      {item.badge}
                                    </Badge>
                                  )}
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
              <UserMenuPopover name={displayName} email={displayEmail}>
                <UserMenuItem
                  icon={<BadgeCheck className="w-4 h-4" />}
                  onClick={() => setAccountOpen(true)}
                >
                  Account
                </UserMenuItem>
                <UserMenuItem icon={<BellIcon className="w-4 h-4" />}>
                  Notifications
                </UserMenuItem>
                <div className="h-px bg-border/50 my-1" />
                <UserMenuItem
                  icon={<LogOut className="w-4 h-4" />}
                  destructive
                  onClick={logout}
                  disabled={isLoggingOut}
                >
                  Log out
                </UserMenuItem>
              </UserMenuPopover>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {
        <AccountDialog
          open={accountOpen}
          onOpenChange={setAccountOpen}
          user={session}
        />
      }
    </>
  );
}
