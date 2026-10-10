"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar/Sidebar";
import { filterRoutesByAccess, routesConfig } from "./constants/route.constants";
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
  const hasMerchant = session.merchantIds.length > 0;
  const visibleRoutes = useMemo(
    () => filterRoutesByAccess(routesConfig, { permissions: session.permissions, hasMerchant }),
    [session.permissions, hasMerchant],
  );

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarHeader className="h-[60px] justify-center border-b border-border p-0 px-4">
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
