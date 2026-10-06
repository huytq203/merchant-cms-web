import { Skeleton } from "@/components/ui/skeleton/Skeleton";

export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6" aria-label="Đang tải đăng nhập">
      <div className="w-full max-w-md space-y-5">
        <Skeleton className="mx-auto h-10 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
