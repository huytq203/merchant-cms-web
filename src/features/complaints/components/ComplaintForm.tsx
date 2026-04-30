"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { ComplaintFilter } from "./ComplaintFilter";
import { ComplaintTable } from "./ComplaintTable";
import usePagination from "@/hooks/usePagination";
import { useComplaintsQuery } from "../hooks/use-complaints-query";
import { ComplaintListFilter } from "../types/types";

const ComplaintForm = () => {
  const [applied, setApplied] = useState<ComplaintListFilter>({});
  const { setPage, setPageSize, params, page, pageSize } = usePagination();
  const payload = { ...applied, ...params };
  const { data, isLoading } = useComplaintsQuery(payload);

  const handleSearch = (value: ComplaintListFilter) => {
    setApplied(value);
    setPage(1);
  };

  const total = data?.pagination.total ?? 0;

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="pt-5">
          <ComplaintFilter onSearch={handleSearch} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Kết quả
            {total > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({total} khiếu nại)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ComplaintTable
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

export default ComplaintForm;
