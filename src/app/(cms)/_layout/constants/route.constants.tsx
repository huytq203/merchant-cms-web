"use client";
import React from "react";
import {
  BookOpen,
  Type,

} from "lucide-react";

export interface SubPage {
  title: string;
  href?: string;     // exact match
  pattern?: string;  // pattern match, dùng [segment] cho dynamic (e.g. "/sub-merchants/[id]/edit")
}

interface SidebarItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
  subPages?: SubPage[];
}

interface SidebarSection {
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
    // icon: <BookOpen className="w-4 h-4" />,
    collapsible: false,
    items: [
      {
        title: "Tổng quan",
        href: "/dashboard",
        // icon: <Type className="w-4 h-4" />,
      },
    ],
  },
  {
    title: "Quản lý Merchant",
    // icon: <BookOpen className="w-4 h-4" />,
    collapsible: false,
    items: [
      {
        title: "Quản lý quyền hạn",
        href: "/permissions",
        // icon: <Type className="w-4 h-4" />,
      },
      {
        title: "Danh sách Sub Merchant",
        href: "/sub-merchants",
        // icon: <Type className="w-4 h-4" />,
        subPages: [
          { title: "Tạo mới Sub Merchant", pattern: "/sub-merchants/new" },
          { title: "Chỉnh sửa Sub Merchant", pattern: "/sub-merchants/[id]/edit" },
        ],
      },
    ],
  },
  {
    title:"Quản lý giao dịch Merchant",
    // icon: <BookOpen className="w-4 h-4" />,
    collapsible: false,
    items: [
      {
        title: "Danh sách giao dịch",
        href: "/merchants",
        // icon: <Type className="w-4 h-4" />,
      },
    ],
  }
];
