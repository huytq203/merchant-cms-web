'use client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Textarea,
  FileUpload,
  Select,
} from '@/components/ui';
import type { Transaction } from '../types';

const RECONCILIATION_REASONS = [
  { label: 'Giao dịch bị tính phí nhầm', value: 'wrong_charge' },
  { label: 'Giao dịch không được xử lý', value: 'not_processed' },
  { label: 'Giao dịch trùng lặp', value: 'duplicate' },
  { label: 'Số tiền không khớp', value: 'amount_mismatch' },
  { label: 'Lý do khác', value: 'other' },
];

const reconciliationSchema = z.object({
  reason: z.string().min(1, 'Vui lòng chọn lý do tra soát'),
  note: z.string().min(10, 'Ghi chú phải có ít nhất 10 ký tự'),
  files: z.array(z.instanceof(File)).optional(),
});

type ReconciliationFormValues = z.infer<typeof reconciliationSchema>;

export interface DialogReconciliationProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DialogReconciliation({ transaction, open, onOpenChange }: DialogReconciliationProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReconciliationFormValues>({
    resolver: zodResolver(reconciliationSchema),
    defaultValues: { reason: '', note: '', files: [] },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onSubmit = () => {
    // Chưa có API BE: báo rõ thay vì giả vờ đã gửi thành công.
    toast.info('Chức năng chưa được hỗ trợ');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Khởi tạo yêu cầu Tra soát</DialogTitle>
          {transaction && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Giao dịch:{' '}
              <span className="font-mono font-semibold text-primary">{transaction.code}</span>
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          <Controller
            name="reason"
            control={control}
            render={({ field }) => (
              <Select
                label="Lý do tra soát"
                placeholder="-- Chọn lý do --"
                options={RECONCILIATION_REASONS}
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
                label="Ghi chú chi tiết"
                placeholder="Nhập mô tả tình huống cụ thể..."
                rows={4}
                maxLength={500}
                showCount
                required
                value={field.value}
                onChange={(e) => field.onChange(e)}
                error={errors.note?.message}
              />
            )}
          />

          <Controller
            name="files"
            control={control}
            render={({ field }) => (
              <FileUpload
                label="Bằng chứng đính kèm (Ảnh/Bill/Biên bản)"
                description="Hỗ trợ ảnh và PDF · Tối đa 5 tệp · Mỗi tệp tối đa 5 MB"
                accept="image/*,.pdf"
                multiple
                maxFiles={5}
                maxSize={5 * 1024 * 1024}
                value={field.value ?? []}
                onChange={(files) => field.onChange(files)}
                showPreview
                size="sm"
              />
            )}
          />

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Gửi yêu cầu tra soát
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
