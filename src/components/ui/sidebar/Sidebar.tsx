'use client';
// Sidebar — barrel re-export
// Split into: SidebarContext, SidebarLayout, SidebarMenu, SidebarUserMenu

export { useSidebar, SidebarProvider } from './SidebarContext';
export type { SidebarProviderProps } from './SidebarContext';

export {
  SidebarTrigger,
  Sidebar,
  SidebarRail,
  SidebarInset,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarSeparator,
} from './SidebarLayout';
export type { SidebarProps } from './SidebarLayout';

export {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarNavLink,
  SidebarMenuCollapsible,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
} from './SidebarMenu';
export type { SidebarMenuButtonProps, SidebarNavLinkProps, SidebarMenuCollapsibleProps } from './SidebarMenu';

export { UserMenuPopover, UserMenuItem } from './SidebarUserMenu';
