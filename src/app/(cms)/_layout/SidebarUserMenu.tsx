import { BadgeCheck, Bell, LogOut } from "lucide-react";
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
  /** Có quyền MANAGE_NOTIFICATION thì mới hiện mục "Cài đặt thông báo". */
  canViewNotificationSettings?: boolean;
  onOpenNotificationSettings?: () => void;
}

/** Chân sidebar: thông tin người dùng, mở hồ sơ, đăng xuất (chuông thông báo nằm ở header). */
export function SidebarUserMenu({
  name, email, isLoggingOut, onOpenAccount, onLogout, canViewNotificationSettings = false, onOpenNotificationSettings,
}: SidebarUserMenuProps) {
  return (
    <SidebarFooter className="border-t border-sidebar-border pb-2">
      <SidebarMenu>
        <SidebarMenuItem>
          <UserMenuPopover name={name} email={email}>
            <UserMenuItem icon={<BadgeCheck className="w-4 h-4" />} onClick={onOpenAccount}>
              Account
            </UserMenuItem>
            {canViewNotificationSettings && (
              <UserMenuItem icon={<Bell className="w-4 h-4" />} onClick={onOpenNotificationSettings}>
                Cài đặt thông báo
              </UserMenuItem>
            )}
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
