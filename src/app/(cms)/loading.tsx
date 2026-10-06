import { Skeleton } from "@/components/ui/skeleton/Skeleton";

export default function CmsLoading() {
  return (
    <div className="space-y-6" aria-label="Đang tải nội dung">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
