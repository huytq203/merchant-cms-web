import React from "react";
import { hasAnyPermission, type MerchantPermission } from "@/features/auth/permissions";
import { PERMISSION_GATES } from "@/features/auth/permission-gates";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  Store,
  MonitorSmartphone,
  ArrowLeftRight,
  ShoppingBag,
  RotateCcw,
  MessageSquareWarning,
  Wallet,
  ScrollText,
  Landmark,
  BadgeCheck,
  PiggyBank,
} from "lucide-react";

export interface SubPage {
  title: string;
  href?: string;     // exact match
  pattern?: string;  // pattern match, dùng [segment] cho dynamic (e.g. "/sub-merchants/[id]/edit")
}

export interface SidebarItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
  subPages?: SubPage[];
  /** One permission, or a list of which any one is enough. */
  permission?: MerchantPermission | readonly MerchantPermission[];
  /** Page works on the session's own Master; hidden for a session limited to Subs. */
  requiresMerchant?: boolean;
}

export interface SidebarSection {
  title: string;
  icon?: React.ReactNode;
  collapsible: boolean;
  defaultOpen?: boolean;
  items: SidebarItem[];
}

export interface BreadcrumbSegment {
  title: string;
  href?: string;
}

export const homeRoute = { title: "Trang chủ", href: "/" };

function matchesPattern(pathname: string, pattern: string): boolean {
  const patternParts = pattern.split("/");
  const pathParts = pathname.split("/");
  if (patternParts.length !== pathParts.length) return false;
  return patternParts.every((part, i) => part.startsWith("[") || part === pathParts[i]);
}

export function getBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  for (const section of routesConfig) {
    for (const item of section.items) {
      if (pathname === item.href) {
        return [{ title: item.title }];
      }

      if (pathname.startsWith(item.href + "/")) {
        const parent: BreadcrumbSegment = { title: item.title, href: item.href };

        if (item.subPages) {
          const matchedSub = item.subPages.find(
            (sp) =>
              (sp.href && sp.href === pathname) ||
              (sp.pattern && matchesPattern(pathname, sp.pattern)),
          );
          if (matchedSub) {
            return [parent, { title: matchedSub.title }];
          }
        }

        return [parent];
      }
    }
  }

  return [];
}

export const routesConfig: SidebarSection[] = [
  {
    title: "Dashboard",
    collapsible: false,
    items: [
      {
        title: "Tổng quan",
        href: "/dashboard",
        requiresMerchant: true,
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Quản lý Merchant",
    collapsible: false,
    items: [
      {
        title: "Danh sách nhóm quyền",
        permission: "MANAGE_PERMISSION_GROUP",
        href: "/permissions",
        requiresMerchant: true,
        icon: <ShieldCheck className="w-4 h-4" />,
      },
      {
        title: "Danh sách người dùng",
        permission: "MANAGE_USER",
        href: "/users",
        requiresMerchant: true,
        icon: <Users className="w-4 h-4" />,
      },
      {
        title: "Danh sách Sub-merchant",
        permission: "MANAGE_SUB_MERCHANT",
        href: "/sub-merchants",
        requiresMerchant: true,
        icon: <Store className="w-4 h-4" />,
      },
      {
        title: "Danh sách Terminal",
        permission: PERMISSION_GATES.terminalRead,
        href: "/terminals",
        icon: <MonitorSmartphone className="w-4 h-4" />,
      },
      {
        title: "Danh sách tài khoản ngân hàng",
        permission: PERMISSION_GATES.bankAccountRead,
        href: "/bank-accounts",
        requiresMerchant: true,
        icon: <Landmark className="w-4 h-4" />,
      },
      {
        title: "Hồ sơ KYB và ĐVCNTT",
        permission: "MANAGE_SUB_MERCHANT",
        href: "/merchants",
        requiresMerchant: true,
        icon: <BadgeCheck className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Quản lý giao dịch Merchant",
    collapsible: false,
    items: [
      {
        title: "Danh sách giao dịch",
        permission: "VIEW_TRANSACTION",
        href: "/transaction",
        requiresMerchant: true,
        icon: <ArrowLeftRight className="w-4 h-4" />,
      },
      {
        title: "Danh sách đơn hàng",
        permission: "VIEW_ORDER",
        href: "/order",
        requiresMerchant: true,
        icon: <ShoppingBag className="w-4 h-4" />,
      },
      {
        title: "Danh sách yêu cầu hoàn tiền",
        permission: "VIEW_REFUND",
        href: "/refund",
        requiresMerchant: true,
        icon: <RotateCcw className="w-4 h-4" />,
      },
      {
        title: "Danh sách khiếu nại",
        permission: "VIEW_DISPUTE",
        href: "/complaint",
        requiresMerchant: true,
        icon: <MessageSquareWarning className="w-4 h-4" />,
      },
      {
        title: "Danh sách giao dịch rút tiền",
        permission: "VIEW_WITHDRAWAL",
        href: "/withdrawal",
        requiresMerchant: true,
        icon: <Wallet className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Tài chính",
    collapsible: false,
    items: [
      {
        title: "Số dư Sub-merchant",
        permission: "VIEW_BALANCE",
        href: "/sub-balances",
        icon: <PiggyBank className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Nhật ký hệ thống",
    collapsible: false,
    items: [
      {
        title: "Nhật ký hệ thống",
        permission: "VIEW_AUDIT_LOG",
        href: "/audit-logs",
        icon: <ScrollText className="w-4 h-4" />,
      },
    ],
  },
];

export const routeSearchOptions = routesConfig.flatMap((section) =>
  section.items.map((item) => ({ label: item.title, value: item.href })),
);

export function getRouteTitle(href: string): string {
  return routeSearchOptions.find((option) => option.value === href)?.label ?? href;
}

export interface RouteAccess {
  permissions: readonly MerchantPermission[];
  hasMerchant: boolean;
}

export function filterRoutesByAccess(
  sections: SidebarSection[],
  { permissions, hasMerchant }: RouteAccess,
): SidebarSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          (!item.permission || hasAnyPermission(permissions, typeof item.permission === "string" ? [item.permission] : item.permission)) &&
          (!item.requiresMerchant || hasMerchant),
      ),
    }))
    .filter((section) => section.items.length > 0);
}

/** First page the session may open, or null when it may open none. Pure, so server code can call it. */
export function findLandingPath(access: RouteAccess): string | null {
  return filterRoutesByAccess(routesConfig, access)[0]?.items[0]?.href ?? null;
}
