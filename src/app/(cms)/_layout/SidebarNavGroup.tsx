import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuCollapsible,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar/Sidebar";
import { Separator } from "@/components/ui/separator/Separator";
import type { SidebarSection } from "./constants/route.constants";
import { isPathActive } from "./sidebar-active";
import { SidebarNavLink } from "./SidebarNavLink";

/** Một nhóm menu; nhóm collapsible tự mở khi có mục con đang active hoặc `defaultOpen`. */
export function SidebarNavGroup({ section, pathname }: { section: SidebarSection; pathname: string }) {
  const isChildActive = section.items.some((item) => isPathActive(pathname, item.href));
  const shouldDefaultOpen = isChildActive || section.defaultOpen === true;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {section.collapsible ? (
            <SidebarMenuItem className="">
              <SidebarMenuCollapsible
                id={section.title}
                icon={
                  <span className="shrink-0 w-4 h-4 flex items-center justify-center">
                    {section?.icon}
                  </span>
                }
                label={section.title}
                defaultOpen={shouldDefaultOpen}
                isChildActive={isChildActive}
              >
                {section.items.map((item) => (
                  <SidebarMenuSubItem key={item.href}>
                    <SidebarNavLink
                      item={item}
                      isActive={isPathActive(pathname, item.href)}
                      size="sm"
                    />
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuCollapsible>
              <Separator className="mt-2" />
            </SidebarMenuItem>
          ) : (
            section.items.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarNavLink item={item} isActive={isPathActive(pathname, item.href)} />
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
