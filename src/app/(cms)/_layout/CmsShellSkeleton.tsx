import { Skeleton } from "@/components/ui/skeleton/Skeleton";

export function CmsShellSkeleton() {
  return (
    <div className="flex h-screen w-full overflow-hidden" aria-label="Đang tải trang quản lý">
      <aside className="hidden w-64 shrink-0 space-y-5 border-r p-4 md:block">
        <Skeleton className="h-10 w-36" />
        {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-9 w-full" />)}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[60px] shrink-0 items-center gap-4 border-b px-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-5 w-48" />
        </header>
        <main className="space-y-6 p-6">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-56 w-full" />
        </main>
      </div>
    </div>
  );
}
