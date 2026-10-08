"use client";

import type { ReactNode } from "react";
import { CircleAlert, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";

type ResultStateType = "loading" | "error" | "empty";

interface ResultStateProps {
  state: ResultStateType;
  onRetry?: () => void;
  action?: ReactNode;
  emptyMessage?: string;
  errorMessage?: string;
  loadingLabel?: string;
}

function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="space-y-3 p-4">
      <Skeleton variant="muted" className="h-9 w-full" />
      {[1, 2, 3, 4, 5].map((row) => <Skeleton key={row} variant="muted" className="h-12 w-full" />)}
    </div>
  );
}

export function ResultState({ state, onRetry, action, emptyMessage, errorMessage, loadingLabel }: ResultStateProps) {
  if (state === "loading") return <LoadingState label={loadingLabel ?? "Đang tải dữ liệu"} />;

  const isError = state === "error";
  const message = isError
    ? (errorMessage ?? "Không thể tải dữ liệu. Vui lòng thử lại.")
    : (emptyMessage ?? "Chưa có dữ liệu phù hợp.");
  const Icon = isError ? CircleAlert : Inbox;

  return (
    <div
      role={isError ? "alert" : undefined}
      className="flex min-h-56 flex-col items-center justify-center gap-3 px-4 py-10 text-center"
    >
      <Icon className={isError ? "size-8 text-danger" : "size-8 text-primary"} aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {isError && onRetry ? <Button type="button" variant="outline" onClick={onRetry}>Thử lại</Button> : null}
      {!isError ? action : null}
    </div>
  );
}
