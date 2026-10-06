"use client";

import { Button } from "@/components/ui/button/Button";
import { isUnsupportedError } from "../utils/unsupported";

type Props = { error: Error; onRetry: () => void };

/** Error state of a module list: a calm notice when unsupported, otherwise the message with retry. */
export function ModuleQueryError({ error, onRetry }: Props) {
  if (isUnsupportedError(error)) {
    return (
      <div role="status" className="py-8 text-center">
        <p className="font-semibold">Chưa hỗ trợ</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Chức năng này chưa được kết nối với hệ thống. Vui lòng quay lại sau.
        </p>
      </div>
    );
  }
  return (
    <div role="alert" className="flex flex-col items-center gap-2 py-8 text-center">
      <p>{error.message}</p>
      <Button type="button" variant="ghost" onClick={onRetry}>
        Thử lại
      </Button>
    </div>
  );
}
