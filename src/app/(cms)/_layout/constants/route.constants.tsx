"use client";
import React from "react";
import {
  BookOpen,
  Type,
 
} from "lucide-react";
import { Badge } from "@/components/ui/badge/Badge";

export interface SubPage {
  title: string;
  href: string;
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

export function getBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  for (const section of routesConfig) {
    for (const item of section.items) {
      if (pathname !== item.href && !pathname.startsWith(item.href + "/")) {
        continue;
      }

      const isSubRoute = pathname !== item.href;

      const segments: BreadcrumbSegment[] = [
        { title: item.title, href: isSubRoute ? item.href : undefined },
      ];

      return segments;
    }
  }

  return [];
}

export const routesConfig: SidebarSection[] = [
  {
    title: "Dashboard",
    icon: <BookOpen className="w-4 h-4" />,
    collapsible: false,
    items: [
      {
        title: "Tổng quan",
        href: "/dashboard",
        icon: <Type className="w-4 h-4" />,
      },
      
    ],
  },
  {
    title: "Quản lý Merchant",
    icon: <BookOpen className="w-4 h-4" />,
    collapsible: true,
    items: [
      {
        title: "Danh sách giao dịch",
        href: "/merchants",
        icon: <Type className="w-4 h-4" />,
        badge:"new",
      },
      {
        title: "Danh sách Sub Merchant",
        href: "/sub-merchants",
        icon: <Type className="w-4 h-4" />,
        badge:"new",
      },
    ],
  },
];
