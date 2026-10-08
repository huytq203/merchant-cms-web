"use client";

import { Plus } from "lucide-react";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
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
      <PageHeader
        title={getRouteTitle("/terminals")}
        action={
        <Button type="button" variant="solid" onClick={dialogs.openCreate}>
          <Plus size={16} aria-hidden="true" /> Thêm Terminal
        </Button>
        }
      />
      <div>
        <TerminalFilters
          key={`${filter.name ?? ""}:${filter.status ?? ""}:${filter.subMerchantId ?? ""}`}
          initial={filter}
          onSearch={navigation.search}
        />
      </div>
      <TerminalResults filter={filter} dialogs={dialogs} onPageChange={navigation.changePage} />
      <TerminalDialogs dialogs={dialogs} actions={actions} />
    </div>
  );
}
