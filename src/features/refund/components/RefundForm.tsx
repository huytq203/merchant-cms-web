"use client";
import { Button, Card, CardContent, Sheet, SheetContent, SheetHeader, SheetTitle, Text } from "@/components/ui";
import React, { useState } from "react";
import RefundFilter from "./RefundFilter";
import { Download, Filter } from "lucide-react";
import { RefundTable } from "./RefundTable";
import { useRefundsQuery } from "../hooks/use-refunds-query";
import usePagination from "@/hooks/usePagination";
import { RefundFilterValue } from "../schemas/Refund.schema";

interface RefundApiParams {
  keywords?: string;
  invoiceCode?: string;
  transactionCode?: string;
  status?: string;
  subMerchantId?: string;
  createdFromDate?: string;
  createdToDate?: string;
}

const RefundForm = () => {
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = useState<RefundApiParams>({});

  const { setPage, setPageSize, params, page, pageSize } = usePagination();

  const { data, isLoading } = useRefundsQuery({ ...filter, ...params });

  const handleSearch = (values: RefundFilterValue) => {
    const { createdFromDate, createdToDate, ...rest } = values;
    const apiParams = {
      ...rest,
      createdFromDate: createdFromDate instanceof Date ? createdFromDate.toISOString() : undefined,
      createdToDate: createdToDate instanceof Date ? createdToDate.toISOString() : undefined,
    };
    setFilter(apiParams);
    setPage(1);
  };

  const total = data?.pagination.total ?? 0;
  return (
    <div className="space-y-3">
      {/* <RefundFilter /> */}
      <div className="flex items-center justify-between">
        <div className="">
          <Text as="h1" className="text-2xl font-bold ">
            Quản lý yêu cầu hoàn tiền
          </Text>
          <Text as="p" className="text-sm text-muted-foreground mt-1">
            Kiểm tra, xử lý các yêu cầu hoàn tiền của cửa hàng.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
          >
            Xuất excel
          </Button>
          <Button
            onClick={() => setOpen(true)}
            size="sm"
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Tìm kiếm nâng cao
          </Button>
        </div>
      </div>
      <Card>
        <CardContent>
          <RefundTable
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="h-fit" direction="top" keepMounted>
          <SheetHeader>
            <SheetTitle>Tìm kiếm nâng cao</SheetTitle>
          </SheetHeader>

          <div className="p-2">
            <RefundFilter
              onSearch={handleSearch}
              defaultValues={filter as RefundFilterValue}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default RefundForm;
