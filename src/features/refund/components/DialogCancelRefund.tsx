'use client';
import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from '@/components/ui/alert-dialog/AlertDialog';
import { Button } from '@/components/ui/button/Button';
import { TriangleAlert } from 'lucide-react';
import type { Refund } from '../types/type';

interface DialogCancelRefundProps {
  refund: Refund | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DialogCancelRefund({
  refund,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DialogCancelRefundProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="items-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-warning/10 mb-1 mx-auto">
            <TriangleAlert className="h-7 w-7 text-warning" />
          </div>

          <AlertDialogTitle className="text-center text-lg">
            Xác nhận hủy yêu cầu?
          </AlertDialogTitle>

          <AlertDialogDescription className="text-center leading-relaxed">
            Bạn đang thực hiện hủy yêu cầu hoàn tiền{' '}
            <span className="font-semibold font-mono text-warning">
              {refund?.code ?? '—'}
            </span>
            . Số dư đang tạm giữ sẽ được giải phóng về ví Merchant ngay lập tức.{' '}
            <span className="font-medium text-foreground">
              Hành động này không thể hoàn tác.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="sm:flex-row sm:justify-center gap-2 mt-2">
          <AlertDialogClose
            render={
              <Button variant="outline" size="md" disabled={isLoading}>
                Quay lại
              </Button>
            }
          />
          <Button
            variant="danger"
            size="md"
            isLoading={isLoading}
            onClick={onConfirm}
          >
            Hủy yêu cầu ngay
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DialogCancelRefund;
