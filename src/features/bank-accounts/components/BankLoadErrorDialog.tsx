"use client";

import { Button } from "@/components/ui/button/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";

type Props = { message: string; onRetry: () => void; onClose: () => void };

/** Shown when the fresh account (and its version) needed for editing could not be loaded. */
export function BankLoadErrorDialog({ message, onRetry, onClose }: Props) {
  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Không tải được tài khoản</DialogTitle>
        </DialogHeader>
        <p role="alert" className="mt-3 text-sm text-danger">{message}</p>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Đóng
          </Button>
          <Button type="button" variant="solid" onClick={onRetry}>
            Thử lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
