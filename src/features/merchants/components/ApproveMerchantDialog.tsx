'use client';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { CheckCircle } from 'lucide-react';
import type { Merchant } from '../types';
import { useApproveMerchantMutation } from '../hooks/use-merchant-mutations';

interface ApproveMerchantDialogProps {
  merchant: Merchant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ApproveMerchantDialog({
  merchant,
  open,
  onOpenChange,
  onSuccess,
}: ApproveMerchantDialogProps) {
  const { mutate, isPending } = useApproveMerchantMutation();

  const handleConfirm = () => {
    mutate(
      { merchantId: merchant.id },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <DialogTitle className="text-emerald-700">Xác nhận phê duyệt</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-foreground">
            Bạn có chắc chắn muốn phê duyệt merchant:{' '}
            <span className="font-semibold">{merchant.name ?? merchant.email}</span>?
          </p>

          <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Sau khi phê duyệt, hệ thống sẽ tự động:
            </p>
            <ul className="text-sm space-y-1 text-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                Kích hoạt tài khoản merchant
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                Khởi tạo ví tài chính cho merchant
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                Gửi email thông báo kích hoạt thành công
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <DialogClose>
            <Button variant="outline" disabled={isPending}>
              Hủy bỏ
            </Button>
          </DialogClose>
          <Button
            variant="solid"
            onClick={handleConfirm}
            isLoading={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Xác nhận phê duyệt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
