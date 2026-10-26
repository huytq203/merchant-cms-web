import { BadgeCheck, BellIcon, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge/Badge";
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
  unreadCount: number;
  onOpenAccount: () => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
}

const MAX_BADGE_COUNT = 99;

/** Chân sidebar: thông tin người dùng, mở hồ sơ, mở thông báo, đăng xuất. */
export function SidebarUserMenu({ name, email, isLoggingOut, unreadCount, onOpenAccount, onOpenNotifications, onLogout }: SidebarUserMenuProps) {
  return (
    <SidebarFooter className="border-t border-sidebar-border pb-2">
      <SidebarMenu>
        <SidebarMenuItem>
          <UserMenuPopover name={name} email={email}>
            <UserMenuItem icon={<BadgeCheck className="w-4 h-4" />} onClick={onOpenAccount}>
              Account
            </UserMenuItem>
            <UserMenuItem icon={<BellIcon className="w-4 h-4" />} onClick={onOpenNotifications}>
              Notifications
              {unreadCount > 0 ? (
                <Badge variant="soft-primary" size="sm" className="ml-auto tabular-nums">
                  {unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unreadCount}
                  <span className="sr-only"> chưa đọc</span>
                </Badge>
              ) : null}
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
