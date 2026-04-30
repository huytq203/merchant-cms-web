import type { Route } from "next";

export type NavItem = {
  title: string;
  href: Route;
  icon: "dashboard" | "users" | "products" | "orders" | "settings";
};

export const siteConfig = {
  name: "Beam Merchant CMS",
  description: "Hệ thống quản trị thương gia Beam.",
  routes: {
    home: "/" as Route,
    login: "/login" as Route,
    dashboard: "/dashboard" as Route,
  },
} as const;

export const primaryNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard" as Route, icon: "dashboard" },
];
