'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Form, FormField, Textarea } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';

const lockSchema = z.object({
  reason: z.string().min(10, 'Lý do phải có ít nhất 10 ký tự'),
});
type LockFormValues = z.infer<typeof lockSchema>;

export interface DialogActiveProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchantName?: string;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export function DialogActive({
  open,
  onOpenChange,
  merchantName = 'Sub-merchant',
  onConfirm,
  isLoading,
}: DialogActiveProps) {
  const form = useForm<LockFormValues>({
    resolver: zodResolver(lockSchema),
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    if (open) form.reset();
  }, [open, form]);

  const handleSubmit = (values: LockFormValues) => {
    onConfirm(values.reason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận khóa hoạt động</DialogTitle>
        </DialogHeader>

        <div className="my-4 rounded-lg border border-danger/30 bg-danger/5 p-4 space-y-2">
          <p className="text-sm text-foreground">
            Bạn đang thực hiện khóa Sub-merchant:{' '}
            <span className="font-semibold">{merchantName}</span>
          </p>
          <ul className="space-y-1 text-sm text-danger">
            <li className="flex items-start gap-1.5">
              <span aria-hidden>•</span>
              Dừng mọi giao dịch thanh toán ngay lập tức.
            </li>
            <li className="flex items-start gap-1.5">
              <span aria-hidden>•</span>
              Vô hiệu hóa quyền truy cập API Keys.
            </li>
          </ul>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <FormField
              name="reason"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Lý do khóa <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    placeholder="Vui lòng nhập chi tiết lý do khóa (Ví dụ: Nghi ngờ gian lận, Vi phạm hợp đồng...)"
                    rows={3}
                    showCount
                    maxLength={200}
                    description="Tối thiểu 10 ký tự."
                    error={fieldState.error?.message}
                    {...field}
                  />
                </div>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Hủy bỏ
              </Button>
              <Button type="submit" variant="danger" isLoading={isLoading}>
                Xác nhận khóa
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
