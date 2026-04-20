"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/shared/ui/button";
import { useUIStore } from "@/stores/ui-store";

export function SidebarToggle() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={collapsed ? "Mở sidebar" : "Thu gọn sidebar"}
      onClick={toggle}
    >
      {collapsed ? <PanelLeftOpen aria-hidden /> : <PanelLeftClose aria-hidden />}
    </Button>
  );
}
