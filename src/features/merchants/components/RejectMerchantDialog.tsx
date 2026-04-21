'use client';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormField,
} from '@/components/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { rejectMerchantSchema, type RejectMerchantValues } from '../schemas';
import type { Merchant } from '../types';
import { useRejectMerchantMutation } from '../hooks/use-merchant-mutations';

const REJECT_REASONS = [
  { value: 'blur_image', label: 'Ảnh mờ, không rõ nét' },
  { value: 'wrong_info', label: 'Thông tin không khớp với giấy tờ' },
  { value: 'missing_docs', label: 'Thiếu giấy tờ bắt buộc' },
  { value: 'expired_docs', label: 'Giấy tờ đã hết hạn' },
  { value: 'duplicate', label: 'Tài khoản bị trùng lặp' },
  { value: 'other', label: 'Lý do khác' },
];

interface RejectMerchantDialogProps {
  merchant: Merchant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RejectMerchantDialog({
  merchant,
  open,
  onOpenChange,
  onSuccess,
}: RejectMerchantDialogProps) {
  const { mutate, isPending } = useRejectMerchantMutation();
  const [noteLength, setNoteLength] = useState(0);

  const form = useForm<RejectMerchantValues>({
    resolver: zodResolver(rejectMerchantSchema),
    defaultValues: { reason: '', note: '' },
  });

  const handleSubmit = (values: RejectMerchantValues) => {
    mutate(
      { merchantId: merchant.id, reason: values.reason, note: values.note },
      {
        onSuccess: () => {
          form.reset();
          setNoteLength(0);
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  const handleReasonChange = (value: string) => {
    form.setValue('reason', value);
    const found = REJECT_REASONS.find((r) => r.value === value);
    if (found && value !== 'other') {
      const template = `Hồ sơ bị từ chối do: ${found.label}. Vui lòng cập nhật lại thông tin và nộp lại hồ sơ.`;
      form.setValue('note', template);
      setNoteLength(template.length);
    }
  };

  const handleClose = () => {
    form.reset();
    setNoteLength(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-red-700">Từ chối hồ sơ</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Merchant:{' '}
            <span className="font-medium text-foreground">
              {merchant.name ?? merchant.email}
            </span>
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">
            <FormField
              name="reason"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Lý do từ chối <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:border-primary disabled:opacity-50"
                    value={field.value}
                    onChange={(e) => {
                      handleReasonChange(e.target.value);
                    }}
                  >
                    <option value="">-- Chọn lý do --</option>
                    {REJECT_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  {fieldState.error && (
                    <p className="text-xs text-red-500">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            <FormField
              name="note"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Ghi chú chi tiết <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:border-primary resize-none"
                    placeholder="Nhập hướng dẫn cụ thể cho merchant..."
                    maxLength={500}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      setNoteLength(e.target.value.length);
                    }}
                  />
                  <div className="flex items-center justify-between">
                    {fieldState.error ? (
                      <p className="text-xs text-red-500">{fieldState.error.message}</p>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-muted-foreground">{noteLength}/500</span>
                  </div>
                </div>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Đóng
              </Button>
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white"
                isLoading={isPending}
              >
                Gửi yêu cầu
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
