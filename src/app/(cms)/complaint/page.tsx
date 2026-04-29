"use client";
import { useState } from "react";
import * as Card from "@/components/ui/card/Card";
import { Button, Input } from "@/components/ui";
import { Select } from "@/components/ui/select/Select";
import { ComplaintTable } from "@/features/complaints/components/ComplaintTable";
import { useComplaintsQuery } from "@/features/complaints/hooks/use-complaints-query";
import { COMPLAINT_SOURCE_OPTIONS, COMPLAINT_STATUS_OPTIONS } from "@/features/complaints/constants/Complaint.constants";
import usePagination from "@/hooks/usePagination";
import { Download, Search, X } from "lucide-react";
import { toast } from "sonner";

const STATUS_SELECT = [{ label: 'Tất cả trạng thái', value: '' }, ...COMPLAINT_STATUS_OPTIONS];
const SOURCE_SELECT = [{ label: 'Tất cả nguồn', value: '' }, ...COMPLAINT_SOURCE_OPTIONS];

export default function ComplaintPage() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [applied, setApplied] = useState<Record<string, string>>({});
  const { setPage, setPageSize, params, page, pageSize } = usePagination();

  const { data, isLoading } = useComplaintsQuery({ ...applied, ...params });

  const handleSearch = () => {
    setApplied({ keyword, status, source });
    setPage(1);
  };

  const handleReset = () => {
    setKeyword(''); setStatus(''); setSource('');
    setApplied({});
    setPage(1);
  };

  const total = data?.pagination.total ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý Khiếu nại</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Theo dõi và xử lý khiếu nại từ các nguồn</p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => toast.info('Đang xuất dữ liệu...')}>
          Tải Excel
        </Button>
      </div>

      <Card.Card>
        <Card.CardContent className="pt-5">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 items-end">
            <Input
              label="Mã tra soát / Mã GD"
              placeholder="Nhập mã..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Select
              label="Trạng thái"
              options={STATUS_SELECT}
              value={status}
              onChange={setStatus}
              clearable={false}
            />
            <Select
              label="Nguồn khiếu nại"
              options={SOURCE_SELECT}
              value={source}
              onChange={setSource}
              clearable={false}
            />
            <Input
              label="Thời gian từ ngày"
              type="date"
              value={applied.createdFromDate ?? ''}
              onChange={(e) => setApplied((p) => ({ ...p, createdFromDate: e.target.value }))}
            />
            <Input
              label="Thời gian đến ngày"
              type="date"
              value={applied.createdToDate ?? ''}
              onChange={(e) => setApplied((p) => ({ ...p, createdToDate: e.target.value }))}
            />
            <div className="flex gap-2 items-end">
              <Button size="sm" leftIcon={<Search className="h-3.5 w-3.5" />} onClick={handleSearch} className="flex-1">
                Tìm kiếm
              </Button>
              <Button variant="ghost" size="sm" leftIcon={<X className="h-3.5 w-3.5" />} onClick={handleReset}>
                Xóa lọc
              </Button>
            </div>
          </div>
        </Card.CardContent>
      </Card.Card>

      <Card.Card>
        <Card.CardHeader className="pb-3">
          <Card.CardTitle className="text-base">
            Danh sách khiếu nại
            {total > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">(Hiển thị {total} khiếu nại)</span>}
          </Card.CardTitle>
        </Card.CardHeader>
        <Card.CardContent>
          <ComplaintTable
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
