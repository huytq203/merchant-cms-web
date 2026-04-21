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
import { Lock, Unlock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { lockMerchantSchema, type LockMerchantValues } from '../schemas';
import type { Merchant } from '../types';
import { useLockMerchantMutation } from '../hooks/use-merchant-mutations';

interface LockMerchantDialogProps {
  merchant: Merchant;
  action: 'lock' | 'unlock';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LockMerchantDialog({
  merchant,
  action,
  open,
  onOpenChange,
  onSuccess,
}: LockMerchantDialogProps) {
  const { mutate, isPending } = useLockMerchantMutation();
  const isLock = action === 'lock';

  const form = useForm<LockMerchantValues>({
    resolver: zodResolver(lockMerchantSchema),
    defaultValues: { reason: '' },
  });

  const handleSubmit = (values: LockMerchantValues) => {
    mutate(
      { merchantId: merchant.id, reason: values.reason, action },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isLock ? 'bg-red-100' : 'bg-teal-100'
              }`}
            >
              {isLock ? (
                <Lock className="h-5 w-5 text-red-600" />
              ) : (
                <Unlock className="h-5 w-5 text-teal-600" />
              )}
            </div>
            <DialogTitle className={isLock ? 'text-red-700' : 'text-teal-700'}>
              {isLock ? 'Khóa tài khoản merchant' : 'Mở khóa tài khoản merchant'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            isLock
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-teal-50 text-teal-800 border border-teal-200'
          }`}
        >
          {isLock ? (
            <>
              Thao tác này sẽ{' '}
              <span className="font-semibold">khóa ngay lập tức</span> tài khoản của{' '}
              <span className="font-semibold">{merchant.name ?? merchant.email}</span>.
              Merchant sẽ không thể thực hiện bất kỳ giao dịch nào.
            </>
          ) : (
            <>
              Xác nhận mở khóa tài khoản{' '}
              <span className="font-semibold">{merchant.name ?? merchant.email}</span>.
              Merchant sẽ có thể đăng nhập và giao dịch trở lại.
            </>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">
            <FormField
              name="reason"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Lý do <span className="text-red-500">*</span>
                    <span className="text-muted-foreground font-normal ml-1">(tối thiểu 10 ký tự)</span>
                  </label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:border-primary resize-none"
                    placeholder={
                      isLock
                        ? 'Nhập lý do khóa tài khoản...'
                        : 'Nhập lý do mở khóa tài khoản...'
                    }
                    maxLength={500}
                    {...field}
                  />
                  {fieldState.error && (
                    <p className="text-xs text-red-500">{fieldState.error.message}</p>
                  )}
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
                Hủy
              </Button>
              <Button
                type="submit"
                className={
                  isLock
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }
                isLoading={isPending}
              >
                {isLock ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
