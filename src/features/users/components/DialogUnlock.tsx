'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Textarea } from '@/components/ui';
import { User } from '../types/type';

interface DialogUnlockProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (userId: string) => void;
  isLoading?: boolean;
}

export function DialogUnlock({
  user,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DialogUnlockProps) {
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (user) {
      onConfirm(user.id);
      setNote('');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isLoading) {
      setNote('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mở khóa tài khoản</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Success Section */}
          <div className="flex gap-3 p-3 bg-success-soft rounded-lg border border-success/30">
            <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-success">
                Mở khóa tài khoản <span className="font-semibold">{user?.name}</span>
              </p>
              <p className="text-xs text-success mt-1">
                Người dùng sẽ có thể đăng nhập lại sau khi mở khóa.
              </p>
            </div>
          </div>

          {/* Current Lock Reason */}
          {user?.lockReason && (
            <div className="bg-muted p-3 rounded-lg border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Lý do khóa trước đó:</p>
              <p className="text-sm text-muted-foreground italic">{user.lockReason}</p>
            </div>
          )}

          {/* Optional Note Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Ghi chú mở khóa (tùy chọn)
            </label>
            <Textarea
              placeholder="Nhập ghi chú về lý do mở khóa..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isLoading}
              className="min-h-20"
            />
          </div>

          {/* User Info */}
          {user && (
            <div className="bg-muted p-3 rounded-lg space-y-1">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Số điện thoại:</span> {user.phone}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Hủy bỏ
          </Button>
          <Button
            variant="solid"
            isLoading={isLoading}
            onClick={handleSubmit}
            className="bg-success hover:bg-success/80"
          >
            Mở khóa tài khoản
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
