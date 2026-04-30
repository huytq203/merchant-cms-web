'use client';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Textarea,
  Input,
  RadioGroup,
  Radio,
} from '@/components/ui';
import { Select } from '@/components/ui/select/Select';
import type { Transaction } from '../types';

const REFUND_REASONS = [
  { label: 'Khách hàng đổi ý', value: 'customer_changed_mind' },
  { label: 'Sản phẩm bị lỗi', value: 'defective_product' },
  { label: 'Sản phẩm không đúng mô tả', value: 'not_as_described' },
  { label: 'Giao dịch trùng lặp', value: 'duplicate_transaction' },
  { label: 'Lý do khác', value: 'other' },
];

const refundSchema = z
  .object({
    refundType: z.enum(['full', 'partial']),
    amount: z.string().optional(),
    reason: z.string().min(1, 'Vui lòng chọn lý do hoàn tiền'),
    note: z.string().optional(),
  })
  .refine(
    ({ refundType, amount }) => {
      if (refundType !== 'partial') return true;
      return !!amount && Number(amount) > 0;
    },
    { message: 'Vui lòng nhập số tiền hợp lệ', path: ['amount'] },
  );

type RefundFormValues = z.infer<typeof refundSchema>;

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
}

export interface DialogRefundProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DialogRefund({ transaction, open, onOpenChange }: DialogRefundProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RefundFormValues>({
    resolver: zodResolver(refundSchema),
    defaultValues: { refundType: 'full', amount: '', reason: '', note: '' },
  });

  const refundType = useWatch({ control, name: 'refundType' });

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onSubmit = async () => {
    // TODO: gọi API tạo yêu cầu hoàn tiền
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo yêu cầu hoàn tiền</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-muted-foreground">Giao dịch gốc</span>
            <span className="font-mono font-semibold text-primary text-right">
              {transaction?.code ?? '—'}
            </span>
            <span className="text-muted-foreground">Số tiền có thể hoàn</span>
            <span className="font-mono font-semibold text-right">
              {transaction ? formatVnd(transaction.amount) : '—'}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Hình thức hoàn tiền</span>
            <Controller
              name="refundType"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  orientation="horizontal"
                  value={field.value}
                  onValueChange={(val: unknown) => field.onChange(val as string)}
                  className="gap-6"
                >
                  <Radio value="full" label="Hoàn toàn bộ" />
                  <Radio value="partial" label="Hoàn một phần" />
                </RadioGroup>
              )}
            />
          </div>

          {refundType === 'partial' && (
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <Input
                  label="Số tiền hoàn tiền (VND)"
                  placeholder="Nhập số tiền cần hoàn"
                  type="number"
                  description={
                    transaction
                      ? `Lưu ý: Số tiền hoàn không được vượt quá ${formatVnd(transaction.amount)}`
                      : undefined
                  }
                  error={errors.amount?.message}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e)}
                  onBlur={field.onBlur}
                />
              )}
            />
          )}

          <Controller
            name="reason"
            control={control}
            render={({ field }) => (
              <Select
                label="Lý do hoàn tiền"
                placeholder="-- Chọn lý do --"
                options={REFUND_REASONS}
                value={field.value}
                onChange={(val) => field.onChange(val)}
                error={errors.reason?.message}
                clearable={false}
              />
            )}
          />

          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <Textarea
                label="Ghi chú thêm"
                placeholder="Nhập chi tiết lý do..."
                rows={3}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e)}
              />
            )}
          />

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Xác nhận Hoàn tiền
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
