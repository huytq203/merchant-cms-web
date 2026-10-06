"use client";
import React from "react";
import type { MerchantPermission } from "@/features/auth/permissions";
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
  permission?: MerchantPermission;
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
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Quản lý Merchant",
    collapsible: false,
    items: [
      {
        title: "Quản lý quyền hạn",
        permission: "MANAGE_PERMISSION_GROUP",
        href: "/permissions",
        icon: <ShieldCheck className="w-4 h-4" />,
      },
      {
        title: "Quản lý nhân sự",
        permission: "MANAGE_USER",
        href: "/users",
        icon: <Users className="w-4 h-4" />,
      },
      {
        title: "Danh sách Sub Merchant",
        permission: "MANAGE_SUB_MERCHANT",
        href: "/sub-merchants",
        icon: <Store className="w-4 h-4" />,
      },
      {
        title: "Danh sách Terminal",
        permission: "MANAGE_SUB_MERCHANT",
        href: "/terminals",
        icon: <MonitorSmartphone className="w-4 h-4" />,
      },
      {
        title: "Tài khoản ngân hàng",
        permission: "MANAGE_SUB_MERCHANT",
        href: "/bank-accounts",
        icon: <Landmark className="w-4 h-4" />,
      },
      {
        title: "Hồ sơ KYB / ĐVCNTT",
        permission: "MANAGE_SUB_MERCHANT",
        href: "/merchants",
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
        icon: <ArrowLeftRight className="w-4 h-4" />,
      },
      {
        title: "Quản lý Đơn hàng",
        permission: "VIEW_ORDER",
        href: "/order",
        icon: <ShoppingBag className="w-4 h-4" />,
      },
      {
        title: "Hoàn tiền",
        permission: "VIEW_REFUND",
        href: "/refund",
        icon: <RotateCcw className="w-4 h-4" />,
      },
      {
        title: "Khiếu nại",
        permission: "VIEW_DISPUTE",
        href: "/complaint",
        icon: <MessageSquareWarning className="w-4 h-4" />,
      },
      {
        title: "Lịch sử Rút Tiền",
        permission: "VIEW_WITHDRAWAL",
        href: "/withdrawal",
        icon: <Wallet className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Nhật ký hệ thống",
    collapsible: false,
    items: [
      {
        title: "Audit Log",
        permission: "VIEW_AUDIT_LOG",
        href: "/audit-logs",
        icon: <ScrollText className="w-4 h-4" />,
      },
    ],
  },
];

export function filterRoutesByPermissions(
  sections: SidebarSection[],
  permissions: readonly MerchantPermission[],
): SidebarSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || permissions.includes(item.permission)),
    }))
    .filter((section) => section.items.length > 0);
}
