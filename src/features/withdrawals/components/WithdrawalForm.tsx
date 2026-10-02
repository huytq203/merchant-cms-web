"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { WithdrawalFilter } from "./WithdrawalFilter";
import { WithdrawalTable } from "./WithdrawalTable";
import usePagination from "@/hooks/usePagination";
import { useWithdrawalsQuery } from "../hooks/use-withdrawals-query";
import { WithdrawalListFilter } from "../types/types";

const WithdrawalForm = () => {
  const [applied, setApplied] = useState<WithdrawalListFilter>({});
  const { setPage, setPageSize, params, page, pageSize } = usePagination();
  const payload = { ...applied, ...params };
  const { data, isLoading } = useWithdrawalsQuery(payload);

  const handleSearch = (value: WithdrawalListFilter) => {
    setApplied(value);
    setPage(1);
  };

  const total = data?.pagination.total ?? 0;

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="pt-5">
          <WithdrawalFilter onSearch={handleSearch} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Kết quả
            {total > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({total} yêu cầu rút tiền)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WithdrawalTable
            data={data?.data ?? []}
            isLoading={isLoading}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={(p, ps) => {
              setPage(p);
              setPageSize(ps);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default WithdrawalForm;
