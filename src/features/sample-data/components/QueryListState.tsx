"use client";

import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { ModuleQueryError } from "./ModuleQueryError";

type ListData<T> = { rows: T[]; total: number };

type Props<T> = {
  query: UseQueryResult<ListData<T>, Error>;
  emptyText: string;
  children: (data: ListData<T>) => ReactNode;
};

/** The four states of a list: loading, error (or unsupported), empty and data. */
export function QueryListState<T>({ query, emptyText, children }: Props<T>) {
  if (query.isPending) {
    return (
      <div role="status" aria-busy="true" aria-label="Đang tải dữ liệu" className="space-y-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  if (query.isError) {
    return <ModuleQueryError error={query.error} onRetry={() => void query.refetch()} />;
  }
  if (query.data.rows.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">{emptyText}</p>;
  }
  return <>{children(query.data)}</>;
}
