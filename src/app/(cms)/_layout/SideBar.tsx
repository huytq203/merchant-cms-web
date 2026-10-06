"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar/Sidebar";
import { filterRoutesByPermissions, routesConfig } from "./constants/route.constants";
import { useSession } from "@/features/auth/components/session-provider";
import { useLogoutMutation } from "@/features/auth/hooks/use-logout-mutation";
import { AccountDialog } from "@/features/account/components/AccountDialog";
import { SidebarBrand } from "./SidebarBrand";
import { SidebarNavGroup } from "./SidebarNavGroup";
import { SidebarUserMenu } from "./SidebarUserMenu";

export default function DocSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { logout, isPending: isLoggingOut } = useLogoutMutation();
  const [accountOpen, setAccountOpen] = useState(false);
  const session = useSession();
  const visibleRoutes = useMemo(
    () => filterRoutesByPermissions(routesConfig, session.permissions),
    [session.permissions],
  );

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarHeader className="">
          <SidebarBrand isCollapsed={state === "collapsed"} />
        </SidebarHeader>
        <SidebarContent>
          {visibleRoutes.map((section) => (
            <SidebarNavGroup key={section.title} section={section} pathname={pathname} />
          ))}
        </SidebarContent>
        <SidebarUserMenu
          name={session.username}
          email={session.email ?? ""}
          isLoggingOut={isLoggingOut}
          onOpenAccount={() => setAccountOpen(true)}
          onLogout={logout}
        />
      </Sidebar>
      <AccountDialog open={accountOpen} onOpenChange={setAccountOpen} user={session} />
    </>
  );
}
