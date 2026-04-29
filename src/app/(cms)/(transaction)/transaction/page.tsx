"use client";
import * as Card from "@/components/ui/card/Card";
import { Button } from "@/components/ui";
import { TransactionFilters } from "@/features/transactions/components/TransactionFilters";
import { TransactionTable } from "@/features/transactions/components/TransactionTable";
import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";
import type { TransactionFilterValues, TransactionApiParams } from "@/features/transactions/schemas";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet/Sheet";
import { Download, Filter } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import usePagination from "@/hooks/usePagination";

export default function TransactionsPage() {
  const [filter, setFilter] = useState<TransactionApiParams>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { setPage, setPageSize, params, page, pageSize } = usePagination();

  const { data, isLoading } = useTransactionsQuery({ ...filter, ...params });

  const handleSearch = (values: TransactionFilterValues) => {
    const { createdFrom, createdTo, ...rest } = values;
    const apiParams: TransactionApiParams = {
      ...rest,
      createdFromDate: createdFrom ? createdFrom.toISOString() : undefined,
      createdToDate: createdTo ? createdTo.toISOString() : undefined,
    };
    setFilter(apiParams);
    setPage(1);
    // setIsFilterOpen(false);
  };

  const handleExport = () => {
    toast.info("Đang chuẩn bị dữ liệu, vui lòng đợi...");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Danh sách giao dịch
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Theo dõi và quản lý tất cả giao dịch của các merchant
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Xuất Excel
          </Button>
          <Button
            size="sm"
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={() => setIsFilterOpen(true)}
          >
            Tìm kiếm nâng cao
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card.Card>
        <Card.CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Card.CardTitle className="text-base">
              Kết quả tìm kiếm
              {!!data && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({data.pagination.total} giao dịch)
                </span>
              )}
            </Card.CardTitle>
          </div>
        </Card.CardHeader>
        <Card.CardContent>
          <TransactionTable
            data={data?.data ?? []}
            isLoading={isLoading}
            total={data?.pagination.total}
            page={page}
            pageSize={pageSize}
            onPageChange={(p, ps) => {
              setPage(p);
              setPageSize(ps);
            }}
          />
        </Card.CardContent>
      </Card.Card>

      {/* Filter Sheet */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent direction="top" className="h-fit">
          <SheetHeader>
            <SheetTitle>Tìm kiếm nâng cao</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <TransactionFilters
              onSearch={handleSearch}
            />
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}
