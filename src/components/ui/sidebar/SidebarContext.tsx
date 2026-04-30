'use client';
import * as React from 'react';
import { cn } from '@/lib/utils/cn';

// ─── Constants ────────────────────────────────────────────────────────────────

export const SIDEBAR_WIDTH_DEFAULT = 256; // px
export const SIDEBAR_WIDTH_MIN = 160; // px
export const SIDEBAR_WIDTH_MAX = 480; // px
export const SIDEBAR_WIDTH_ICON = '4rem';
export const MOBILE_BREAKPOINT = 768;

// ─── Context ──────────────────────────────────────────────────────────────────

export type SidebarState = 'expanded' | 'collapsed';

export interface SidebarContextValue {
  state: SidebarState;
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  sidebarWidth: number;
  setSidebarWidth: (w: number) => void;
}

export const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

/** Props for the SidebarProvider that manages sidebar state (open/collapsed, mobile, width) */
export interface SidebarProviderProps {
  children: React.ReactNode;
  /** Initial open state for uncontrolled usage (default: true) */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Callback fired when the sidebar opens or closes */
  onOpenChange?: (open: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const SidebarProvider = React.forwardRef<HTMLDivElement, SidebarProviderProps>(
  ({ children, defaultOpen = true, open: controlledOpen, onOpenChange, className, style }, ref) => {
    const [isMobile, setIsMobile] = React.useState(false);
    const [openMobile, setOpenMobile] = React.useState(false);
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
    const [sidebarWidth, setSidebarWidth] = React.useState(SIDEBAR_WIDTH_DEFAULT);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen! : internalOpen;

    React.useEffect(() => {
      const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      check();
      window.addEventListener('resize', check);
      return () => window.removeEventListener('resize', check);
    }, []);

    const setOpen = React.useCallback(
      (val: boolean) => {
        if (!isControlled) setInternalOpen(val);
        onOpenChange?.(val);
      },
      [isControlled, onOpenChange]
    );

    const toggleSidebar = React.useCallback(() => {
      if (isMobile) setOpenMobile((v) => !v);
      else setOpen(!open);
    }, [isMobile, open, setOpen]);

    React.useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
          e.preventDefault();
          toggleSidebar();
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [toggleSidebar]);

    const state: SidebarState = open ? 'expanded' : 'collapsed';

    return (
      <SidebarContext.Provider
        value={{ state, open, setOpen, toggleSidebar, isMobile, openMobile, setOpenMobile, sidebarWidth, setSidebarWidth }}
      >
        <div
          ref={ref}
          data-sidebar-state={state}
          style={
            {
              '--sidebar-width': `${sidebarWidth}px`,
              '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn('group/sidebar-wrapper flex min-h-screen w-full has-data-[variant=inset]:bg-muted/30', className)}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = 'SidebarProvider';
