"use client";

import { BadgeCheck, BellIcon, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  UserMenuPopover,
  UserMenuItem,
} from "@/components/ui/sidebar/Sidebar";

interface SidebarUserMenuProps {
  name: string;
  email: string;
  isLoggingOut: boolean;
  onOpenAccount: () => void;
  onLogout: () => void;
}

/** Chân sidebar: thông tin người dùng, mở hồ sơ, hộp thư thông báo, đăng xuất. */
export function SidebarUserMenu({ name, email, isLoggingOut, onOpenAccount, onLogout }: SidebarUserMenuProps) {
  const router = useRouter();
  return (
    <SidebarFooter className="border-t border-sidebar-border pb-2">
      <SidebarMenu>
        <SidebarMenuItem>
          <UserMenuPopover name={name} email={email}>
            <UserMenuItem icon={<BadgeCheck className="w-4 h-4" />} onClick={onOpenAccount}>
              Account
            </UserMenuItem>
            {/* Opens the personal inbox page (same destination as the header bell's "Xem tất cả"). */}
            <UserMenuItem icon={<BellIcon className="w-4 h-4" />} onClick={() => router.push("/notifications")}>
              Thông báo
            </UserMenuItem>
            <div className="h-px bg-border/50 my-1" />
            <UserMenuItem
              icon={<LogOut className="w-4 h-4" />}
              destructive
              onClick={onLogout}
              disabled={isLoggingOut}
            >
              Log out
            </UserMenuItem>
          </UserMenuPopover>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
