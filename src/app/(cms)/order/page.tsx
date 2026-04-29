"use client";
import { useState } from "react";
import * as Card from "@/components/ui/card/Card";
import { Button, Input } from "@/components/ui";
import { Select } from "@/components/ui/select/Select";
import { OrderTable } from "@/features/orders/components/OrderTable";
import { useOrdersQuery } from "@/features/orders/hooks/use-orders-query";
import { ORDER_SOURCE_OPTIONS, ORDER_STATUS_OPTIONS } from "@/features/orders/constants/Order.constants";
import usePagination from "@/hooks/usePagination";
import { Download, Plus, Search } from "lucide-react";
import { toast } from "sonner";

const SOURCE_SELECT = [{ label: 'Tất cả nguồn', value: '' }, ...ORDER_SOURCE_OPTIONS];
const STATUS_SELECT = [{ label: 'Tất cả trạng thái', value: '' }, ...ORDER_STATUS_OPTIONS];

export default function OrderPage() {
  const [source, setSource] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [status, setStatus] = useState('');
  const [applied, setApplied] = useState<Record<string, string>>({});
  const { setPage, setPageSize, params, page, pageSize } = usePagination();

  const { data, isLoading } = useOrdersQuery({ ...applied, ...params });

  const handleSearch = () => {
    setApplied({ source, createdBy, status });
    setPage(1);
  };

  const total = data?.pagination.total ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý Đơn hàng Tổng hợp</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Theo dõi tất cả giao dịch từ API và Payment Link
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => toast.info('Đang xuất dữ liệu...')}>
            Xuất Excel
          </Button>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            Tạo Link mới
          </Button>
        </div>
      </div>

      <Card.Card>
        <Card.CardContent className="pt-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
            <Input
              label="Từ ngày"
              type="date"
              value={applied.createdFromDate ?? ''}
              onChange={(e) => setApplied((p) => ({ ...p, createdFromDate: e.target.value }))}
            />
            <Input
              label="Đến ngày"
              type="date"
              value={applied.createdToDate ?? ''}
              onChange={(e) => setApplied((p) => ({ ...p, createdToDate: e.target.value }))}
            />
            <Select
              label="Nguồn đơn"
              options={SOURCE_SELECT}
              value={source}
              onChange={setSource}
              clearable={false}
            />
            <Input
              label="Người tạo (Sub-user)"
              placeholder="Tất cả nhân viên"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
            />
            <Select
              label="Trạng thái"
              options={STATUS_SELECT}
              value={status}
              onChange={setStatus}
              clearable={false}
            />
          </div>
          <div className="flex justify-end mt-3">
            <Button size="sm" leftIcon={<Search className="h-4 w-4" />} onClick={handleSearch}>
              Tìm kiếm
            </Button>
          </div>
        </Card.CardContent>
      </Card.Card>

      <Card.Card>
        <Card.CardHeader className="pb-3">
          <Card.CardTitle className="text-base">
            Kết quả
            {total > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({total} đơn hàng)</span>}
          </Card.CardTitle>
        </Card.CardHeader>
        <Card.CardContent>
          <OrderTable
            data={data?.data ?? []}
            isLoading={isLoading}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={(p, ps) => { setPage(p); setPageSize(ps); }}
          />
        </Card.CardContent>
      </Card.Card>
    </div>
  );
}
