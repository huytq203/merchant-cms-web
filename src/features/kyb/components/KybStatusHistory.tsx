"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button/Button";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { formatDate } from "@/lib/utils/helper";
import { MERCHANT_STATUS_LABELS } from "../constants/status-labels";
import { kybQueries } from "../kyb-queries";

type Props = { merchantId: string };

const PAGE_SIZE = 10;

export function KybStatusHistory({ merchantId }: Props) {
  const [page, setPage] = useState(1);
  const history = useQuery(kybQueries.history(merchantId, page));
  const totalPages = Math.max(1, Math.ceil((history.data?.total ?? 0) / PAGE_SIZE));
  return (
    <section className="grid gap-3 rounded-xl border border-border bg-background p-4" aria-labelledby="kyb-history-title">
      <h2 id="kyb-history-title" className="text-base font-semibold">Lịch sử trạng thái</h2>
      {history.isPending && <Skeleton className="h-16 w-full" />}
      {history.isError && <p role="alert" className="text-sm text-danger">{history.error.message}</p>}
      {history.data && history.data.rows.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có lịch sử trạng thái.</p>
      )}
      {history.data && history.data.rows.length > 0 && (
        <ul className="grid gap-3">
          {history.data.rows.map((entry, index) => (
            <li key={entry.auditLogId ?? `${entry.occurredAt}-${index}`} className="grid gap-0.5 border-b border-border/60 pb-3 last:border-b-0">
              <p className="text-sm font-medium">{MERCHANT_STATUS_LABELS[entry.toStatus].label}</p>
              {(entry.reason ?? entry.rejectedReasonDetail) && (
                <p className="text-sm text-muted-foreground">
                  Lý do: {entry.reason ?? entry.rejectedReasonDetail}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{entry.occurredAt ? formatDate(entry.occurredAt) : "—"}</p>
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Trang trước
          </Button>
          <span className="text-sm text-muted-foreground">{page}/{totalPages}</span>
          <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Trang sau
          </Button>
        </div>
      )}
    </section>
  );
}
