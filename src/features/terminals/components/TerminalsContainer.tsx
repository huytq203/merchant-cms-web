"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { useTerminalActions } from "../hooks/use-terminal-actions";
import { useTerminalDialogs } from "../hooks/use-terminal-dialogs";
import { useTerminalListNavigation } from "../hooks/use-terminal-list-navigation";
import type { TerminalListFilter } from "../types";
import { TerminalDialogs } from "./TerminalDialogs";
import { TerminalFilters } from "./TerminalFilters";
import { TerminalResults } from "./TerminalResults";

type Props = { filter: TerminalListFilter };

export function TerminalsContainer({ filter }: Props) {
  const dialogs = useTerminalDialogs();
  const actions = useTerminalActions(dialogs);
  const navigation = useTerminalListNavigation(filter);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Danh sách Terminal</h1>
        <Button type="button" variant="solid" onClick={dialogs.openCreate}>
          <Plus size={16} aria-hidden="true" /> Thêm Terminal
        </Button>
      </header>
      <section className="rounded-xl border bg-card p-4" aria-label="Bộ lọc tìm kiếm">
        <TerminalFilters
          key={`${filter.name ?? ""}:${filter.status ?? ""}:${filter.subMerchantId ?? ""}`}
          initial={filter}
          onSearch={navigation.search}
        />
      </section>
      <TerminalResults filter={filter} dialogs={dialogs} onPageChange={navigation.changePage} />
      <TerminalDialogs dialogs={dialogs} actions={actions} />
    </div>
  );
}
