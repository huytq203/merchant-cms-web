'use client';
import React from "react";
import {
  BookOpen,
  ChevronsUpDown,
  FormInput,
  Info,
  LayoutGrid,
  ListChecks,
  Minus,
  ScrollText,
  Settings,
  Square,
  Tag,
  TextCursorInput,
  UserCircle,
} from "lucide-react";

interface SidebarItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface SidebarSection {
  title: string;
  icon?: React.ReactNode;
  collapsible: boolean;
  defaultOpen?: boolean;
  items: SidebarItem[];
}

export const routesConfig: SidebarSection[] = [
  {
    title: "Tổng quan",
    icon: <BookOpen className="w-4 h-4" />,
    collapsible: true,
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
      },
      {
        title: "Quản lý danh sách merchants",
        href: "/merchants",
      },
     
    ],
  },
];
