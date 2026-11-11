"use client";

import { usePathname, useRouter } from "next/navigation";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { bankAccountQueries } from "../bank-account-queries";
import { useBankAccountDialogs } from "../hooks/use-bank-account-dialogs";
import type { BankAccountFilter } from "../types";
import { BankAccountDialogs } from "./BankAccountDialogs";
import { BankAccountFilters } from "./BankAccountFilters";
import { BankAccountResults } from "./BankAccountResults";

type Props = { filter: BankAccountFilter; canManage: boolean };

function toSearchParams(filter: BankAccountFilter): string {
  const params = new URLSearchParams({ page: String(filter.page), pageSize: String(filter.pageSize) });
  if (filter.linkStatus) params.set("linkStatus", filter.linkStatus);
  if (filter.status) params.set("status", filter.status);
  if (filter.subMerchantId) params.set("subMerchantId", filter.subMerchantId);
  return params.toString();
}

export function BankAccountsContainer({ filter, canManage }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const dialogs = useBankAccountDialogs();
  const list = useQuery(bankAccountQueries.list(filter));
  const navigate = (next: BankAccountFilter) => router.push(`${pathname}?${toSearchParams(next)}`);

  return (
    <div className="space-y-5">
      <PageHeader
        title={getRouteTitle("/bank-accounts")}
        description="Tài khoản dùng để nhận quyết toán và rút tiền"
        action={canManage ? (
          <Button type="button" variant="solid" onClick={dialogs.openCreate}>
            <Plus size={16} aria-hidden="true" /> Thêm tài khoản
          </Button>
        ) : undefined}
      />
      <div>
        <BankAccountFilters
          key={`${filter.linkStatus ?? ""}:${filter.status ?? ""}:${filter.subMerchantId ?? ""}`}
          initial={filter}
          onSearch={(values) => navigate({ page: 1, pageSize: filter.pageSize, ...values })}
        />
      </div>
      <BankAccountResults
        list={list}
        page={filter.page}
        pageSize={filter.pageSize}
        onPageChange={(page, pageSize) => navigate({ ...filter, page, pageSize })}
        onView={(account) => dialogs.openFor("detail", account)}
        onEdit={canManage ? (account) => dialogs.openFor("edit", account) : undefined}
        onSetDefault={canManage ? (account) => dialogs.openFor("default", account) : undefined}
        onDelete={canManage ? (account) => dialogs.openFor("delete", account) : undefined}
      />
      <BankAccountDialogs dialogs={dialogs} />
    </div>
  );
}
