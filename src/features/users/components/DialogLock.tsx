'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Textarea, Text } from '@/components/ui';
import { User } from '../types/type';
import { lockUserSchema } from '@/app/api/v1/admin/merchants/users/types/schemas';

interface DialogLockProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (userId: string, reason: string) => void;
  isLoading?: boolean;
}

export function DialogLock({
  user,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DialogLockProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    const validation = lockUserSchema.safeParse({ lockReason: reason });

    if (!validation.success) {
      const flatErrors = validation.error.flatten();
      const fieldError = flatErrors.fieldErrors.lockReason?.[0];
      setError(fieldError || 'Dữ liệu không hợp lệ');
      return;
    }

    if (user) {
      onConfirm(user.id, reason);
      setReason('');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isLoading) {
      setReason('');
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Khóa tài khoản</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Section */}
          <div className="flex gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">
                Khóa tài khoản của <span className="font-semibold">{user?.name}</span>
              </p>
              <p className="text-xs text-red-700 mt-1">
                Người dùng sẽ không thể đăng nhập sau khi bị khóa. Hành động này có thể khôi phục được.
              </p>
            </div>
          </div>

          {/* Reason Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Lý do khóa <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Nhập lý do khóa (tối thiểu 10 ký tự)..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              disabled={isLoading}
              className="min-h-24"
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* User Info */}
          {user && (
            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
              <p className="text-xs text-gray-600">
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p className="text-xs text-gray-600">
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
            className="bg-red-600 hover:bg-red-700"
          >
            Khóa tài khoản
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
