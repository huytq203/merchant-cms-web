'use client';

import { useState, type ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import { ConfirmModal } from '@/components/modal/ConfirmModal';
import { REASON_LENGTH_MESSAGE, REASON_MAX_LENGTH, reasonSchema } from '@/lib/schemas/reason';

export interface ReasonConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  reasonLabel: string;
  confirmLabel: string;
  confirmVariant: 'danger' | 'solid';
  /** The record being changed, named in the dialog so the action is never ambiguous. */
  target?: { title: string; subtitle?: string } | null;
  /** A consequence shown before the reason field, usually a {@link DangerNotice}. */
  notice?: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  onConfirm: (reason: string) => void | Promise<void>;
}

export function DangerNotice({ children }: { children: ReactNode }) {
  return (
    <div role="note" className="flex items-start gap-2.5 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

/** Asks for a reason of 10 to 500 characters before a lock or unlock, with a live counter. */
export function ReasonConfirmModal({ open, onOpenChange, title, description, reasonLabel, confirmLabel, confirmVariant, target, notice, isLoading, error, onConfirm }: ReasonConfirmModalProps) {
  const [reason, setReason] = useState('');
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setReason('');
  }
  const valid = reasonSchema.safeParse(reason).success;

  return (
    <ConfirmModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      reasonLabel={reasonLabel}
      reasonPlaceholder="Nhập lý do (10 đến 500 ký tự)"
      reasonValue={reason}
      onReasonChange={setReason}
      reasonError={reason && !valid ? REASON_LENGTH_MESSAGE : undefined}
      reasonMaxLength={REASON_MAX_LENGTH}
      confirmLabel={confirmLabel}
      confirmVariant={confirmVariant}
      confirmDisabled={!valid}
      isLoading={isLoading}
      onConfirm={() => void onConfirm(reason.trim())}
    >
      {target ? (
        <div className="rounded-xl border border-border bg-page px-3.5 py-3">
          <p className="font-semibold text-foreground">{target.title}</p>
          {target.subtitle ? <p className="text-xs tabular-nums text-muted-foreground">{target.subtitle}</p> : null}
        </div>
      ) : null}
      {notice}
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
    </ConfirmModal>
  );
}
