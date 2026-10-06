"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/button/Button";
import type { MerchantUser } from "../schemas/user.schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: MerchantUser | null;
  isPending: boolean;
  error?: string;
  onConfirm: () => void;
}

export function UserUnlockDialog({ open, onOpenChange, user, isPending, error, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mở khoá người dùng</DialogTitle>
          <DialogDescription>Bạn sắp mở khoá {user?.fullName}.</DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button type="button" variant="solid" disabled={isPending} onClick={onConfirm}>
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
