'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { ChevronRight } from 'lucide-react';
import { tv } from 'tailwind-variants';
import { Tooltip, TooltipTrigger, TooltipContent } from '../tooltip/Tooltip';
import { cn } from '@/lib/utils/cn';
import { useSidebar } from './SidebarContext';

// ─── Group ────────────────────────────────────────────────────────────────────

export const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn('relative flex flex-col w-full min-w-0 px-2 py-1', className)}
      {...props}
    />
  )
);
SidebarGroup.displayName = 'SidebarGroup';

export const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { state } = useSidebar();
    return (
      <div
        ref={ref}
        data-sidebar="group-label"
        className={cn(
          'flex h-8 shrink-0 items-center rounded-md px-2',
          'text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider',
          'motion-safe:transition-all motion-safe:duration-200 overflow-hidden whitespace-nowrap select-none',
          state === 'collapsed' ? 'opacity-0 h-0 mb-0 hidden' : 'opacity-100',
          className
        )}
        {...props}
      />
    );
  }
);
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

export const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="group-content"
      className={cn('w-full', className)}
      {...props}
    />
  )
);
SidebarGroupContent.displayName = 'SidebarGroupContent';

// ─── Menu ─────────────────────────────────────────────────────────────────────

export const SidebarMenu = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-sidebar="menu"
      className={cn('flex flex-col gap-0.5 list-none m-0 p-0 w-full', className)}
      {...props}
    />
  )
);
SidebarMenu.displayName = 'SidebarMenu';

export const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      data-sidebar="menu-item"
      className={cn('group/menu-item relative', className)}
      {...props}
    />
  )
);
SidebarMenuItem.displayName = 'SidebarMenuItem';

// ─── SidebarMenuButton ────────────────────────────────────────────────────────

export const menuButtonVariants = tv({
  base: [
    'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md',
    'text-sm font-medium outline-none ring-sidebar-ring motion-safe:transition-all motion-safe:duration-150',
    'hover:bg-accent hover:text-accent-foreground',
    'focus-visible:ring-2 active:bg-accent/80',
    'disabled:pointer-events-none disabled:opacity-50',
    'group-has-data-[sidebar=menu-action]/menu-item:pr-8',
    // Data state active
    'data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:font-semibold',
  ],
  variants: {
    size: {
      sm: 'h-7 text-xs px-2',
      md: 'h-9 px-2',
      lg: 'h-11 text-base px-3',
    },
    collapsed: {
      true: 'justify-center px-0',
      false: 'justify-start',
    },
  },
  defaultVariants: { size: 'md', collapsed: false },
});

/** Props for a sidebar menu button */
export interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Render as child element instead of a button */
  asChild?: boolean;
  /** Marks the button as the currently active item */
  isActive?: boolean;
  /** Tooltip text shown when the sidebar is collapsed */
  tooltip?: string;
  /** Button size variant */
  size?: 'sm' | 'md' | 'lg';
}

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, isActive = false, tooltip, size = 'md', children, ...props }, ref) => {
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    const button = (
      <button
        ref={ref}
        type="button"
        data-sidebar="menu-button"
        data-active={isActive}
        data-size={size}
        aria-label={isCollapsed ? tooltip : undefined}
        className={menuButtonVariants({ size, collapsed: isCollapsed, className })}
        {...props}
      >
        {isCollapsed
          ? React.Children.toArray(children)[0]
          : children}
      </button>
    );

    if (isCollapsed && tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger render={button} />
          <TooltipContent side="right">{tooltip}</TooltipContent>
        </Tooltip>
      );
    }

    return button;
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

// ─── SidebarNavLink — wraps Next.js Link ─────────────────────────────

/** Props for a sidebar navigation link (wraps Next.js Link) */
export interface SidebarNavLinkProps {
  /** Route path for the link */
  to: string;
  /** Icon rendered before the label */
  icon?: React.ReactNode;
  /** Display text for the link; also used as tooltip when collapsed */
  label: string;
  /** Match route exactly (no nested-path matching) */
  end?: boolean;
  /** Badge element rendered after the label */
  badge?: React.ReactNode;
  /** Link size variant */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SidebarNavLink: React.FC<SidebarNavLinkProps> = ({
  to,
  icon,
  label,
  end = false,
  badge,
  size = 'md',
  className,
}) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const pathname = usePathname();
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  const link = (
    <Link
      href={to as Route}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        menuButtonVariants({ size, collapsed: isCollapsed, className }),
        isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold' : 'text-sidebar-foreground/70'
      )}
    >
      {icon && (
        <span className="shrink-0 flex h-4 w-4 items-center justify-center">
          {icon}
        </span>
      )}
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge && <span className="ml-auto shrink-0">{badge}</span>}
        </>
      )}
    </Link>
  );

  if (isCollapsed && label) {
    return (
      <Tooltip>
        <TooltipTrigger render={link} />
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
};
SidebarNavLink.displayName = 'SidebarNavLink';

// ─── SidebarMenuCollapsible — nhóm có sub-items ───────────────────────────────

/** Props for a collapsible sidebar menu group with sub-items */
export interface SidebarMenuCollapsibleProps {
  /** Unique identifier for the group */
  id: string;
  /** Icon displayed next to the group label */
  icon: React.ReactNode;
  /** Display text for the collapsible group header */
  label: string;
  children: React.ReactNode;
  /** Whether the group is initially expanded */
  defaultOpen?: boolean;
  /** When true, the group auto-expands and shows an active indicator */
  isChildActive?: boolean;
}

export const SidebarMenuCollapsible: React.FC<SidebarMenuCollapsibleProps> = ({
  icon,
  label,
  children,
  defaultOpen = false,
  isChildActive = false,
}) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // `isUserOpen` ghi nhớ lựa chọn của người dùng; khi sidebar collapse chỉ ẩn đi,
  // khi expand lại thì khôi phục đúng state cũ.
  const [isUserOpen, setIsUserOpen] = React.useState(defaultOpen || isChildActive);
  const [wasChildActive, setWasChildActive] = React.useState(isChildActive);
  const isOpen = !isCollapsed && isUserOpen;

  // Khi có child active, mở group (điều chỉnh state ngay trong render, không dùng effect)
  if (isChildActive !== wasChildActive) {
    setWasChildActive(isChildActive);
    if (isChildActive) setIsUserOpen(true);
  }

  const trigger = (
    <button
      type="button"
      aria-expanded={isOpen}
      data-active={isChildActive && isCollapsed}
      onClick={() => {
        if (!isCollapsed) {
          setIsUserOpen(!isOpen);
        }
      }}
      className={menuButtonVariants({
        collapsed: isCollapsed,
        className:
          isChildActive && isCollapsed
            ? 'text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70',
      })}
    >
      <span className="shrink-0 flex h-4 w-4 items-center justify-center">{icon}</span>
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate text-left">{label}</span>
          <ChevronRight
            className={cn(
              'ml-auto h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40',
              'motion-safe:transition-transform motion-safe:duration-200',
              isOpen && 'rotate-90'
            )}
          />
        </>
      )}
    </button>
  );

  return (
    <>
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger render={trigger} />
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}

      {/* Sub-items với animation mượt - Sử dụng SidebarMenuSub (ul) để hợp lệ HTML */}
      <SidebarMenuSub
        className={cn(
          'overflow-hidden motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-in-out',
          !isCollapsed && isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {children}
      </SidebarMenuSub>
    </>
  );
};
SidebarMenuCollapsible.displayName = 'SidebarMenuCollapsible';

// ─── SidebarMenuSub ───────────────────────────────────────────────────────────

export const SidebarMenuSub = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => {
    const { state } = useSidebar();
    if (state === 'collapsed') return null;
    return (
      <ul
        ref={ref}
        data-sidebar="menu-sub"
        className={cn('mx-3.5 flex min-w-0 flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5 list-none', className)}
        {...props}
      />
    );
  }
);
SidebarMenuSub.displayName = 'SidebarMenuSub';

export const SidebarMenuSubItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  (props, ref) => <li ref={ref} {...props} />
);
SidebarMenuSubItem.displayName = 'SidebarMenuSubItem';

// ─── Badge & Skeleton ─────────────────────────────────────────────────────────

export const SidebarMenuBadge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="menu-badge"
      className={cn('ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1 text-xs font-medium text-primary', className)}
      {...props}
    />
  )
);
SidebarMenuBadge.displayName = 'SidebarMenuBadge';

export const SidebarMenuSkeleton: React.FC<{ showIcon?: boolean }> = ({ showIcon = true }) => (
  <div className="flex h-9 items-center gap-2 rounded-md px-2">
    {showIcon && <div className="h-4 w-4 rounded bg-sidebar-accent motion-safe:animate-pulse shrink-0" />}
    <div className="h-4 flex-1 rounded bg-sidebar-accent motion-safe:animate-pulse" />
  </div>
);
