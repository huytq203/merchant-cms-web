"use client";

import { useQuery } from "@tanstack/react-query";
import { ResultCard } from "@/components/page/ResultCard";
import { ResultState } from "@/components/page/ResultState";
import { terminalQueries } from "../terminal-queries";
import type { TerminalDialogs } from "../hooks/use-terminal-dialogs";
import type { TerminalListFilter } from "../types";
import { TerminalTable } from "./TerminalTable";

type Props = {
  filter: TerminalListFilter;
  dialogs: TerminalDialogs;
  onPageChange: (page: number, pageSize: number) => void;
};

export function TerminalResults({ filter, dialogs, onPageChange }: Props) {
  const list = useQuery(terminalQueries.list(filter));

  return (
    <ResultCard>
      {list.isPending ? (
        <ResultState state="loading" />
      ) : list.isError ? (
        <ResultState state="error" errorMessage={list.error.message} onRetry={() => void list.refetch()} />
      ) : list.data.rows.length === 0 ? (
        <ResultState state="empty" emptyMessage="Chưa có Terminal phù hợp." />
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
    </ResultCard>
  );
}
