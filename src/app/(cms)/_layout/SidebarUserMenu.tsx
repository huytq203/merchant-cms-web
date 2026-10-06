import { BadgeCheck, BellIcon, LogOut } from "lucide-react";
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

/** Chân sidebar: thông tin người dùng, mở hồ sơ, đăng xuất. */
export function SidebarUserMenu({ name, email, isLoggingOut, onOpenAccount, onLogout }: SidebarUserMenuProps) {
  return (
    <SidebarFooter className="border-t border-sidebar-border pb-2">
      <SidebarMenu>
        <SidebarMenuItem>
          <UserMenuPopover name={name} email={email}>
            <UserMenuItem icon={<BadgeCheck className="w-4 h-4" />} onClick={onOpenAccount}>
              Account
            </UserMenuItem>
            <UserMenuItem icon={<BellIcon className="w-4 h-4" />}>
              Notifications
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
