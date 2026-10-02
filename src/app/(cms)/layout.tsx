"use client"
import { useCallback, useEffect, useRef } from 'react'
import type { PanelImperativeHandle } from 'react-resizable-panels'
import {
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar/Sidebar'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable/Resizable'
import SideBar from './_layout/SideBar'
import Header from './_layout/Header'
import { useUIStore } from '@/stores/ui-store'

interface Props {
  children: React.ReactNode
}

function LayoutBody({ children }: { children?: React.ReactNode }) {
  const { open, setOpen, isMobile } = useSidebar();
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const panelRef = useRef<PanelImperativeHandle>(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    setSidebarOpen(open);
  }, [open, setSidebarOpen]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || isMobile) return;
    syncingRef.current = true;
    if (open) panel.expand();
    else panel.collapse();
    requestAnimationFrame(() => { syncingRef.current = false; });
  }, [open, isMobile]);

  const handleSidebarResize = useCallback(
    (size: { asPercentage: number; inPixels: number }) => {
      if (syncingRef.current) return;
      setOpen(size.inPixels > 8);
    },
    [setOpen],
  );

  const content = (
    <SidebarInset className="h-full">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 h-full">
            {children}
        </div>
      </main>
    </SidebarInset>
  );

  if (isMobile) {
    return (
      <div className="flex h-screen w-full">
        <SideBar />
        {content}
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full w-full">
      <ResizablePanel
        id="app-sidebar"
        defaultSize="256px"
        minSize="160px"
        maxSize="480px"
        collapsible
        collapsedSize="0px"
        groupResizeBehavior="preserve-pixel-size"
        panelRef={panelRef}
        onResize={handleSidebarResize}
      >
        <SideBar />
      </ResizablePanel>
      {open && <ResizableHandle variant="bar" />}

      <ResizablePanel>
        {content}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default function Layout({ children }: Props) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div className="h-screen w-full overflow-hidden">
      <SidebarProvider className="h-full" defaultOpen={sidebarOpen}>
        <LayoutBody>{children}</LayoutBody>
      </SidebarProvider>
    </div>
  );
}
