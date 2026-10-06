"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button/Button";
import { terminalQueries } from "../terminal-queries";
import type { TerminalDialogs } from "../hooks/use-terminal-dialogs";
import type { TerminalListFilter } from "../types";
import { TerminalResultsSkeleton } from "./TerminalResultsSkeleton";
import { TerminalTable } from "./TerminalTable";

type Props = {
  filter: TerminalListFilter;
  dialogs: TerminalDialogs;
  onPageChange: (page: number, pageSize: number) => void;
};

export function TerminalResults({ filter, dialogs, onPageChange }: Props) {
  const list = useQuery(terminalQueries.list(filter));

  return (
    <section className="rounded-xl border bg-card p-4" aria-label="Kết quả tìm kiếm">
      <h2 className="mb-3 font-semibold">Kết quả tìm kiếm {list.data ? `(${list.data.total})` : ""}</h2>
      {list.isPending ? (
        <TerminalResultsSkeleton />
      ) : list.isError ? (
        <div role="alert">
          <p>{list.error.message}</p>
          <Button type="button" variant="ghost" onClick={() => void list.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : list.data.rows.length === 0 ? (
        <p>Không có Terminal</p>
      ) : (
        <TerminalTable
          rows={list.data.rows}
          total={list.data.total}
          page={filter.page}
          pageSize={filter.pageSize}
          onPageChange={onPageChange}
          onView={(row) => dialogs.openFor("detail", row)}
          onEdit={(row) => dialogs.openFor("edit", row)}
          onLock={(row) => dialogs.openFor("lock", row)}
          onUnlock={(row) => dialogs.openFor("unlock", row)}
        />
      )}
    </section>
  );
}
