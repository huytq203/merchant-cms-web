"use client";
import React, { useState } from "react";

import OrderFilter from "./OrderFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { OrderTable } from "./OrderTable";
import usePagination from "@/hooks/usePagination";
import { useOrdersQuery } from "../hooks/use-orders-query";
import { OrderListFilter } from "../types/types";

const OrderForm = () => {
  const [applied, setApplied] = useState<OrderListFilter>({});
  const { setPage, setPageSize, params, page, pageSize } = usePagination();
  const payLoad = { ...applied, ...params };
  const { data, isLoading } = useOrdersQuery(payLoad);

  const handleSearch = (value: OrderListFilter) => {
    setApplied(value);
    setPage(1);
  };



  const total = data?.pagination.total ?? 0;
  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="pt-5">
          <OrderFilter onSearch={handleSearch} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Kết quả
            {total > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({total} đơn hàng)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTable
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

export default OrderForm;
