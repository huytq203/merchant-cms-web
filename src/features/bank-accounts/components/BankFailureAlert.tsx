"use client";

import { Button } from "@/components/ui/button/Button";
import type { BankErrorView } from "../utils/bank-errors";

type Props = { failure: BankErrorView | null; onReload?: () => void };

/** Error inside a dialog; a stale version also offers a reload so the user can retry with fresh data. */
export function BankFailureAlert({ failure, onReload }: Props) {
  if (!failure) return null;
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-2 text-sm text-danger">
      <span>{failure.message}</span>
      {failure.kind === "conflict" && onReload && (
        <Button type="button" variant="outline" size="sm" onClick={onReload}>
          Tải lại dữ liệu
        </Button>
      )}
    </div>
  );
}
