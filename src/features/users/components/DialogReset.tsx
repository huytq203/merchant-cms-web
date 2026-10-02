"use client";

import { KeyRound, TriangleAlert } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { Text } from "@/components/ui";
import type { User } from "../types/type";

interface DialogResetProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (userId: string) => void;
  isLoading?: boolean;
}

export function DialogReset({
  user,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DialogResetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cấp lại mật khẩu</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4 text-center">
          {/* Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>

          {/* Thông tin nhân viên */}
          <div className="space-y-1">
            <Text as="p" className="text-sm text-muted-foreground">
              Xác nhận cấp lại mật khẩu cho nhân viên:
            </Text>
            <Text as="p" className="text-base font-semibold text-foreground">
              {user.name}
            </Text>
            <Text as="p" className="text-sm text-primary">
              {user.email}
            </Text>
          </div>

          {/* Cảnh báo */}
          <div className="w-full rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-left">
            <div className="flex gap-2">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <Text as="p" className="text-sm text-warning">
                <span className="font-semibold">Lưu ý:</span> Mật khẩu hiện tại
                của nhân viên sẽ bị vô hiệu hóa. Hệ thống sẽ sinh mật khẩu mới
                và gửi trực tiếp về email trên.
              </Text>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Hủy bỏ
          </Button>
          <Button
            variant="solid"
            isLoading={isLoading}
            onClick={() => onConfirm(user.id)}
          >
            Xác nhận cấp lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
