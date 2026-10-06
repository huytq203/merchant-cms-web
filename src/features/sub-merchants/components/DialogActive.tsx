'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button/Button';
import { Textarea } from '@/components/ui/textarea/Textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { reasonBodySchema } from '@/lib/schemas/reason';

export type ReasonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  title?: string;
};

export function DialogActive({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  error,
  title = 'Khóa điểm bán',
}: ReasonDialogProps) {
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const parsed = reasonBodySchema.safeParse({ reason });
  const validationError = parsed.success ? null : parsed.error.issues[0]?.message ?? null;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setReason('');
      setLocalError(null);
    }
    onOpenChange(next);
  };
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!parsed.success) {
      setLocalError(validationError);
      return;
    }
    void onConfirm(parsed.data.reason);
  };
  const changeReason = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReason(event.target.value);
    setLocalError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <Textarea
            label="Lý do"
            placeholder="Nhập lý do (10–500 ký tự)"
            aria-label="Lý do"
            required
            value={reason}
            onChange={changeReason}
            error={localError ?? (reason ? validationError ?? undefined : undefined)}
          />
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="solid"
              disabled={!parsed.success || isLoading}
              isLoading={isLoading}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
