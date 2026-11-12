"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import { Button } from "@/components/ui/button/Button";
import { useTerminalActions } from "../hooks/use-terminal-actions";
import { useTerminalDialogs } from "../hooks/use-terminal-dialogs";
import { useTerminalListNavigation } from "../hooks/use-terminal-list-navigation";
import type { TerminalListFilter } from "../types";
import { StaticQrDialog } from "@/features/static-qrs/components/StaticQrDialog";
import type { StaticQrScope } from "@/features/static-qrs/schemas";
import { TerminalDialogs } from "./TerminalDialogs";
import { TerminalFilters } from "./TerminalFilters";
import { TerminalResults } from "./TerminalResults";

type Props = { filter: TerminalListFilter; canManage: boolean };

export function TerminalsContainer({ filter, canManage }: Props) {
  const dialogs = useTerminalDialogs();
  const actions = useTerminalActions(dialogs);
  const navigation = useTerminalListNavigation(filter);
  // Mã QR tĩnh mở theo từng Terminal; dialog tự đọc mã đang dùng của đúng Terminal đó.
  const [staticQr, setStaticQr] = useState<(StaticQrScope & { name: string }) | null>(null);

  return (
    <div className="space-y-5">
      <PageHeader
        title={getRouteTitle("/terminals")}
        action={canManage ? (
          <Button type="button" variant="solid" onClick={dialogs.openCreate}>
            <Plus size={16} aria-hidden="true" /> Thêm Terminal
          </Button>
        ) : undefined}
      />
      <div>
        <TerminalFilters
          key={`${filter.name ?? ""}:${filter.status ?? ""}:${(filter.subMerchantIds ?? []).join(",")}:${filter.terminalType ?? ""}`}
          initial={filter}
          onSearch={navigation.search}
        />
      </div>
      <TerminalResults
        filter={filter}
        dialogs={dialogs}
        canManage={canManage}
        onPageChange={navigation.changePage}
        onStaticQr={(row) => setStaticQr({ subMerchantId: row.subMerchantId, terminalId: row.id, name: `Terminal ${row.name} (${row.tid})` })}
      />
      <TerminalDialogs dialogs={dialogs} actions={actions} canManage={canManage} />
      <StaticQrDialog scope={staticQr} canManage={canManage} onClose={() => setStaticQr(null)} />
    </div>
  );
}
