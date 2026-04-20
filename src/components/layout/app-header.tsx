import { Avatar } from "@/components/shared/ui/avatar";
import { SidebarToggle } from "@/components/shared/layout/sidebar-toggle";
import { SignOutButton } from "@/components/shared/layout/sign-out-button";

import type { SessionUser } from "@/types/auth";

type AppHeaderProps = {
  user: SessionUser;
};

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <SidebarToggle />
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">{user.username}</p>
          <p className="text-xs text-muted-foreground leading-tight capitalize">
            {user.roles[0]?.toLowerCase().replace(/_/g, " ") ?? ""}
          </p>
        </div>
        <Avatar name={user.username} size="md" />
        <SignOutButton />
      </div>
    </header>
  );
}
