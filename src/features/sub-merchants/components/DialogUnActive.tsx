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

const unlockSchema = z.object({
  reason: z.string().min(1, 'Vui lòng nhập lý do mở khóa'),
});
type UnlockFormValues = z.infer<typeof unlockSchema>;

export interface DialogUnActiveProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lockReason?: string;
  lockedBy?: string;
  lockedAt?: string;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export function DialogUnActive({
  open,
  onOpenChange,
  lockReason = '',
  lockedBy = '',
  lockedAt = '',
  onConfirm,
  isLoading,
}: DialogUnActiveProps) {
  const form = useForm<UnlockFormValues>({
    resolver: zodResolver(unlockSchema),
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    if (open) form.reset();
  }, [open, form]);

  const handleSubmit = (values: UnlockFormValues) => {
    onConfirm(values.reason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận mở khóa Sub-merchant</DialogTitle>
        </DialogHeader>

        {lockReason && (
          <div className="my-4 rounded-lg border border-warning/30 bg-warning/8 p-4 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-warning">
              Lý do khóa trước đó:
            </p>
            <p className="text-sm text-foreground">{lockReason}</p>
            {(lockedBy || lockedAt) && (
              <p className="text-xs italic text-warning/80">
                Khóa bởi: {lockedBy} | Lúc: {lockedAt}
              </p>
            )}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <FormField
              name="reason"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Lý do mở khóa <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    placeholder="Nhập căn cứ hoặc ghi chú mở khóa..."
                    rows={3}
                    showCount
                    maxLength={200}
                    error={fieldState.error?.message}
                    {...field}
                  />
                </div>
              )}
            />

            <DialogFooter>
              <Button type="submit" isLoading={isLoading}>
                Xác nhận mở khóa
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Hủy bỏ
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
