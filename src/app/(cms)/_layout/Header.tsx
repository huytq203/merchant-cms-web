'use client';
import { Separator, SidebarTrigger } from '@/components/ui'
import { Autocomplete } from '@/components/ui/autocomplete/Autocomplete'
import { Home, Search } from 'lucide-react'
import React from 'react'
import Link from 'next/link'
import { getBreadcrumbs, homeRoute, routeSearchOptions } from './constants/route.constants';
import { usePathname, useRouter } from 'next/navigation';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="h-[60px] sticky top-0 flex items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4 py-2 shrink-0">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-4" />

      <nav className="flex items-center w-full gap-1.5 text-sm min-w-0">
        <Link
          href={homeRoute.href}
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 shrink-0"
        >
          <Home className="h-3.5 w-3.5" /><span className="hidden sm:inline">{homeRoute.title}</span>
        </Link>

        {breadcrumbs.map((segment, index) => (
          <React.Fragment key={`${segment.title}-${index}`}>
            <Separator orientation="vertical" className="mx-0.5 h-4 shrink-0" />
            {segment.href ? (
              <Link
                href={segment.href}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                {segment.title}
              </Link>
            ) : (
              <span className="truncate font-medium tracking-tight text-foreground">
                {segment.title}
              </span>
            )}
          </React.Fragment>
        ))}

        <Autocomplete
          options={routeSearchOptions}
          placeholder="Tìm kiếm trang..."
          leftIcon={<Search className="h-4 w-4" />}
          clearOnSelect
          emptyText="Không tìm thấy trang"
          onValueChange={router.push}
          className="ml-auto hidden md:flex md:w-[200px] lg:w-[240px]"
        />
      </nav>

      {/* Inbox bell: polls the unread count; the popover lists the latest rows. */}
      <NotificationBell />
    </header>
  )
}

export default Header
