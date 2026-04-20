"use client";

import * as React from "react";

import { Button } from "@/components/shared/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-destructive">
          Lỗi
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Đã xảy ra sự cố
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Một lỗi ngoài ý muốn xuất hiện. Bạn có thể thử lại thao tác vừa rồi.
        </p>
        {error.digest ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Mã lỗi: {error.digest}
          </p>
        ) : null}
        <Button className="mt-6" onClick={reset}>
          Thử lại
        </Button>
      </div>
    </div>
  );
}
