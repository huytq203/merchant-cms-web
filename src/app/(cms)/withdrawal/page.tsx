"use client";
import { useState } from "react";
import * as Card from "@/components/ui/card/Card";
import { Button, Input } from "@/components/ui";
import { Select } from "@/components/ui/select/Select";
import { WithdrawalTable } from "@/features/withdrawals/components/WithdrawalTable";
import { useWithdrawalsQuery } from "@/features/withdrawals/hooks/use-withdrawals-query";
import { WITHDRAWAL_STATUS_OPTIONS } from "@/features/withdrawals/constants/Withdrawal.constants";
import usePagination from "@/hooks/usePagination";
import { ArrowUpFromLine, Download, Search, X } from "lucide-react";
import { toast } from "sonner";

const STATUS_SELECT = [{ label: 'Tất cả trạng thái', value: '' }, ...WITHDRAWAL_STATUS_OPTIONS];

export default function WithdrawalPage() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [applied, setApplied] = useState<Record<string, string>>({});
  const { setPage, setPageSize, params, page, pageSize } = usePagination();

  const { data, isLoading } = useWithdrawalsQuery({ ...applied, ...params });

  const handleSearch = () => {
    setApplied({ keyword, status });
    setPage(1);
  };

  const handleReset = () => {
    setKeyword(''); setStatus('');
    setApplied({});
    setPage(1);
  };

  const total = data?.pagination.total ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lịch sử Rút Tiền</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý các yêu cầu rút tiền thủ công và quyết toán tự động T+1
          </p>
        </div>
        <Button size="sm" leftIcon={<ArrowUpFromLine className="h-4 w-4" />}>
          Tạo yêu cầu rút tiền
        </Button>
      </div>

      <Card.Card>
        <Card.CardContent className="pt-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                Khoảng thời gian tạo
              </label>
              <div className="flex items-center gap-2">
                <Input type="date" value={applied.createdFromDate ?? ''} onChange={(e) => setApplied((p) => ({ ...p, createdFromDate: e.target.value }))} />
                <span className="text-muted-foreground shrink-0">→</span>
                <Input type="date" value={applied.createdToDate ?? ''} onChange={(e) => setApplied((p) => ({ ...p, createdToDate: e.target.value }))} />
              </div>
            </div>
            <Input
              label="Mã GD Rút"
              placeholder="Nhập WDR..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Select
              label="Sub-Merchant"
              options={[{ label: 'Tất cả Sub-Merchant', value: '' }]}
              value={applied.subMerchantId ?? ''}
              onChange={(v) => setApplied((p) => ({ ...p, subMerchantId: v }))}
              clearable={false}
            />
            <Select
              label="Trạng thái"
              options={STATUS_SELECT}
              value={status}
              onChange={setStatus}
              clearable={false}
            />
            <div className="flex gap-2 items-end">
              <Button size="sm" leftIcon={<Search className="h-3.5 w-3.5" />} onClick={handleSearch} className="flex-1">
                Tìm kiếm
              </Button>
              <Button variant="ghost" size="sm" leftIcon={<X className="h-3.5 w-3.5" />} onClick={handleReset}>
                Bỏ lọc
              </Button>
              <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={() => toast.info('Đang xuất...')} className="text-success border-success/40 hover:bg-success/10">
                Excel
              </Button>
            </div>
          </div>
        </Card.CardContent>
      </Card.Card>

      <Card.Card>
        <Card.CardContent className="pt-5">
          <WithdrawalTable
            data={data?.data ?? []}
            isLoading={isLoading}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={(p, ps) => { setPage(p); setPageSize(ps); }}
          />
          {total > 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              Đang xem trang {page} trên tổng số {Math.ceil(total / pageSize)} trang
            </p>
          )}
        </Card.CardContent>
      </Card.Card>
    </div>
  );
}
