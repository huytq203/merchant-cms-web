"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/button/Button";
import { REASON_LENGTH_MESSAGE, reasonSchema } from "@/lib/schemas/reason";
import { Input } from "@/components/ui/input/Input";
import type { MerchantUser } from "../schemas/user.schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: MerchantUser | null;
  isPending: boolean;
  error?: string;
  onConfirm: (reason: string) => void;
}

export function UserLockDialog({ open, onOpenChange, user, isPending, error, onConfirm }: Props) {
  const [reason, setReason] = useState("");
  const valid = reasonSchema.safeParse(reason).success;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Khoá người dùng</DialogTitle>
          <DialogDescription>Bạn sắp khoá {user?.fullName}. Người dùng sẽ không thể đăng nhập.</DialogDescription>
        </DialogHeader>
        <Input
          label="Lý do"
          placeholder="Nhập lý do (10–500 ký tự)"
          value={reason}
          maxLength={500}
          onChange={(event) => setReason(event.target.value)}
          error={reason && !valid ? REASON_LENGTH_MESSAGE : undefined}
        />
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button
            type="button"
            variant="danger"
            disabled={!valid || isPending}
            onClick={() => onConfirm(reason.trim())}
          >
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
