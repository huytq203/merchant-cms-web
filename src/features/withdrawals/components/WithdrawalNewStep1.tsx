'use client';
import { useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Form, FormField, ComboBox, DatePicker, Button, Card, CardContent, Badge } from '@/components/ui';
import { Separator } from '@/components/ui/separator/Separator';
import { RefreshCw, Lock, Eye, Clock } from 'lucide-react';
import { useSubMerchants } from '@/features/orders/hooks/use-sub-merchants';
import { WithdrawalPreviewSection } from './WithdrawalPreviewSection';
import type { SubMerchant } from '@/features/sub-merchants/types';

export interface Step1Values {
  subMerchantId: string;
  toDate: Date;
}

interface WithdrawalNewStep1Props {
  onNext: (values: Step1Values, subMerchant: SubMerchant) => void;
  onCancel: () => void;
}

const MOCK_BALANCE = 125_400_000;
const MOCK_DEPOSIT_CURRENT = 34_650_000;
const MOCK_DEPOSIT_LIMIT = 50_000_000;

const MOCK_PREVIEW = {
  gross: 199_984_500,
  txFee: 2_315_500,
  refund: 8_200_000,
  withdrawFee: 1_999_845,
  deposit: 15_350_000,
  txCount: 156,
};

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' VND';

export function WithdrawalNewStep1({ onNext, onCancel }: WithdrawalNewStep1Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const { data: subMerchantsData, isLoading } = useSubMerchants();
  const subMerchantOptions = useMemo(
    () => (subMerchantsData?.data ?? []).map((sm) => ({ label: `${sm.id} — ${sm.name}`, value: sm.id })),
    [subMerchantsData],
  );

  const form = useForm<Step1Values>({
    defaultValues: { subMerchantId: '', toDate: new Date() },
  });

  const [selectedId, toDate] = useWatch({
    control: form.control,
    name: ['subMerchantId', 'toDate'],
  });

  const selectedSM = useMemo(
    () => (subMerchantsData?.data ?? []).find((sm) => sm.id === selectedId),
    [subMerchantsData, selectedId],
  );

  const hasBankInfo = selectedSM && (selectedSM.bankName || selectedSM.accountNumber);
  const canPreview = !!selectedId && !!toDate;
  const canProceed = canPreview && showPreview && confirmed;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handlePreview = () => {
    setShowPreview(true);
    setConfirmed(false);
  };

  const onSubmit = (values: Step1Values) => {
    if (!selectedSM || !canProceed) return;
    onNext(values, selectedSM);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Section A ──────────────────────────────────── */}
        <Card>
          <CardContent className="space-y-5 pt-5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                A
              </span>
              <p className="font-semibold text-foreground">Chọn điều kiện rút tiền</p>
            </div>

            {/* Sub-merchant + Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="subMerchantId"
                rules={{ required: true }}
                render={({ field }) => (
                  <ComboBox
                    label="Sub-merchant"
                    required
                    options={subMerchantOptions}
                    placeholder={isLoading ? 'Đang tải...' : 'Chọn sub-merchant'}
                    value={field.value}
                    onChange={(v) => { field.onChange(v); setShowPreview(false); setConfirmed(false); }}
                  />
                )}
              />
              <FormField
                control={form.control}
                name="toDate"
                rules={{ required: true }}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-foreground">
                      Rút tiền đến ngày <span className="text-danger">*</span>
                    </p>
                    <DatePicker
                      value={field.value}
                      onChange={(d) => { field.onChange(d); setShowPreview(false); setConfirmed(false); }}
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                )}
              />
            </div>

            {/* Bank account display */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-foreground">Tài khoản NH nhận tiền</p>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-xs font-bold text-primary">
                  {hasBankInfo ? selectedSM.bankName?.slice(0, 3).toUpperCase() : '—'}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  {hasBankInfo ? (
                    <>
                      <p className="text-sm font-semibold">
                        {selectedSM.bankName} — {selectedSM.accountNumber}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">{selectedSM.accountName}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {selectedId ? 'Sub-merchant chưa có tài khoản ngân hàng' : 'Chọn sub-merchant để xem'}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="shrink-0 gap-1">
                  <Lock className="h-3 w-3" /> Chỉ đọc
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Tài khoản được ràng buộc với Sub-merchant. Thay đổi tại Cài đặt &gt; Quản lý Sub-merchant.
              </p>
            </div>

            <Separator />

            {/* Balance + deposit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Số dư khả dụng</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-bold text-success">{formatVnd(MOCK_BALANCE)}</span>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="text-muted-foreground transition-colors hover:text-primary"
                    aria-label="Làm mới số dư"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tình trạng ký quỹ</p>
                <Badge variant="soft-warning" className="gap-1 text-xs">
                  <Clock className="h-4 w-4" />
                  Đang tích lũy: {formatVnd(MOCK_DEPOSIT_CURRENT)} / {formatVnd(MOCK_DEPOSIT_LIMIT)}
                </Badge>
              </div>
            </div>

            {/* Preview trigger */}
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant={showPreview ? 'outline' : 'solid'}
                size="sm"
                disabled={!canPreview}
                onClick={handlePreview}
                leftIcon={<Eye className="h-4 w-4" />}
              >
                 Xem trước giao dịch
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Section B — preview (hiện sau khi click xem trước) ── */}
        {showPreview && selectedSM && (
          <WithdrawalPreviewSection
            subMerchant={selectedSM}
            data={{ ...MOCK_PREVIEW, fromDate: new Date('2026-01-01'), toDate }}
            confirmed={confirmed}
            onConfirmedChange={setConfirmed}
          />
        )}

        {/* ── Footer ──────────────────────────────────────── */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>Hủy bỏ</Button>
          <Button type="submit" disabled={!canProceed}>Tiếp tục</Button>
        </div>

      </form>
    </Form>
  );
}
