import { Skeleton } from "@/components/ui/skeleton/Skeleton";

export default function SetPasswordLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6" aria-label="Đang kiểm tra liên kết">
      <div className="w-full max-w-sm space-y-5">
        <Skeleton className="mx-auto h-10 w-40" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
