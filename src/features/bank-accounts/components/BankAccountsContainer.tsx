"use client";

import { usePathname, useRouter } from "next/navigation";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { bankAccountQueries } from "../bank-account-queries";
import { useBankAccountDialogs } from "../hooks/use-bank-account-dialogs";
import { usePendingBankChanges } from "../hooks/use-pending-bank-changes";
import { BANK_ACCOUNT_WRITES_ENABLED } from "../constants/capabilities";
import type { BankAccount, BankAccountFilter } from "../types";
import { BankAccountDialogs } from "./BankAccountDialogs";
import { BankAccountFilters } from "./BankAccountFilters";
import { BankAccountResults } from "./BankAccountResults";

type Props = { filter: BankAccountFilter };

function toSearchParams(filter: BankAccountFilter): string {
  const params = new URLSearchParams({ page: String(filter.page), pageSize: String(filter.pageSize) });
  if (filter.linkStatus) params.set("linkStatus", filter.linkStatus);
  if (filter.status) params.set("status", filter.status);
  return params.toString();
}

export function BankAccountsContainer({ filter }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const dialogs = useBankAccountDialogs();
  const pending = usePendingBankChanges();
  const list = useQuery(bankAccountQueries.list(filter));
  const writeActions = BANK_ACCOUNT_WRITES_ENABLED
    ? {
      onEdit: (account: BankAccount) => dialogs.openFor("edit", account),
      onSetDefault: (account: BankAccount) => dialogs.openFor("default", account),
      onDelete: (account: BankAccount) => dialogs.openFor("delete", account),
    }
    : {};
  const navigate = (next: BankAccountFilter) => router.push(`${pathname}?${toSearchParams(next)}`);

  return (
    <div className="space-y-5">
      <PageHeader
        title={getRouteTitle("/bank-accounts")}
        description="Tài khoản dùng để nhận quyết toán và rút tiền"
        action={BANK_ACCOUNT_WRITES_ENABLED ? (
          <Button type="button" variant="solid" onClick={dialogs.openCreate}>
            <Plus size={16} aria-hidden="true" /> Thêm tài khoản mới
          </Button>
        ) : undefined}
      />
      {!BANK_ACCOUNT_WRITES_ENABLED ? <p role="note" className="text-sm text-muted-foreground">Thêm hoặc đổi tài khoản ngân hàng hiện chưa mở trên cổng này</p> : null}
      <div>
        <BankAccountFilters
          key={`${filter.linkStatus ?? ""}:${filter.status ?? ""}`}
          initial={filter}
          onSearch={(values) => navigate({ page: 1, pageSize: filter.pageSize, ...values })}
        />
      </div>
      <BankAccountResults
        list={list}
        page={filter.page}
        pageSize={filter.pageSize}
        pendingChanges={pending.byAccountId}
        onPageChange={(page, pageSize) => navigate({ ...filter, page, pageSize })}
        onView={(account) => dialogs.openFor("detail", account)}
        {...writeActions}
      />
      <BankAccountDialogs dialogs={dialogs} onPendingChange={pending.remember} />
    </div>
  );
}
