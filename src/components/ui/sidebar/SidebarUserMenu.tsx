'use client';
import * as React from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { Popover as BasePopover } from '@base-ui/react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../tooltip/Tooltip';
import { cn } from '@/lib/utils/cn';
import { useSidebar } from './SidebarContext';
import { menuButtonVariants } from './SidebarMenu';

// ─── User Menu Popover (shadcn style) ─────────────────────────────────────────

interface UserMenuPopoverProps {
  name: string;
  email: string;
  avatar?: string;
  children?: React.ReactNode;
}

export const UserMenuPopover: React.FC<UserMenuPopoverProps> = ({ name, email, avatar, children }) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [open, setOpen] = React.useState(false);

  const trigger = (
    <BasePopover.Trigger
      render={
        <button
          type="button"
          data-active={open}
          className={cn(
            menuButtonVariants({ size: 'lg', collapsed: isCollapsed }),
            'data-[active=true]:bg-sidebar-accent'
          )}
        >
          <img
            src={avatar || 'https://i.pravatar.cc/100'}
            alt={name}
            className="w-8 h-8 rounded-lg shrink-0 object-cover border border-sidebar-border"
          />
          {!isCollapsed && (
            <>
              <div className="flex-1 text-left overflow-hidden grid">
                <span className="text-sm font-semibold truncate leading-tight">{name}</span>
                <span className="text-xs text-sidebar-foreground/50 truncate leading-tight">{email}</span>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-sidebar-foreground/40" />
            </>
          )}
        </button>
      }
    />
  );

  return (
    <BasePopover.Root open={open} onOpenChange={setOpen}>
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger render={trigger} />
          <TooltipContent side="right">{name}</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <BasePopover.Portal>
        <BasePopover.Positioner side="right" align="end" sideOffset={8}>
          <BasePopover.Popup
            className={cn(
              'z-50 w-64 rounded-xl border border-border bg-popover shadow-xl outline-none p-1',
              'motion-safe:data-open:animate-in motion-safe:data-open:fade-in-0 motion-safe:data-open:zoom-in-95',
              'motion-safe:data-closed:animate-out motion-safe:data-closed:fade-out-0 motion-safe:data-closed:zoom-out-95'
            )}
          >
            {/* User info header */}
            <div className="flex items-center gap-3 p-3 pb-2 border-b border-border/50">
              <img
                src={avatar || 'https://i.pravatar.cc/100'}
                alt={name}
                className="w-10 h-10 rounded-lg object-cover border border-border"
              />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate">{name}</p>
                <p className="text-xs text-muted-foreground truncate">{email}</p>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">{children}</div>
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
};

// ─── UserMenuItem (item trong popover) ───────────────────────────────────────

interface UserMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  destructive?: boolean;
}

export const UserMenuItem: React.FC<UserMenuItemProps> = ({ icon, children, destructive, className, ...props }) => (
  <button
    type="button"
    className={cn(
      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm motion-safe:transition-colors',
      'hover:bg-muted outline-none focus-visible:bg-muted',
      destructive ? 'text-destructive hover:text-destructive' : 'text-foreground',
      className
    )}
    {...props}
  >
    {icon && <span className="shrink-0 h-4 w-4 flex items-center justify-center">{icon}</span>}
    {children}
  </button>
);
