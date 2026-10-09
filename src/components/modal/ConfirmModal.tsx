'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button/Button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { Textarea } from '@/components/ui/textarea/Textarea';

export interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Modal title, e.g., "Khóa terminal". */
  title: string;
  /** Clear description of what will happen, including the affected item. */
  description: string;
  /** Optional reason input field. */
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonValue?: string;
  onReasonChange?: (value: string) => void;
  /** Label for the confirm button; default 'Xác nhận'. */
  confirmLabel?: string;
  /** Cancel button label; default 'Hủy'. */
  cancelLabel?: string;
  /** Caps the reason and shows a "n/max" counter under the field. */
  reasonMaxLength?: number;
  /** Shown under the reason field as an alert, for example when the typed reason is too short. */
  reasonError?: string;
  /** Style of the confirm button; destructive actions keep the default `danger`. */
  confirmVariant?: 'danger' | 'solid';
  /** Disables confirm without implying a request is in flight. */
  confirmDisabled?: boolean;
  /** Hides the cancel button, for example on a result screen that only offers "Xong". */
  hideCancel?: boolean;
  /** Is the confirm action in progress? */
  isLoading?: boolean;
  /** Confirm handler. */
  onConfirm: () => void;
  /** Optional children to render between description and reason field. */
  children?: ReactNode;
}

/**
 * Confirmation modal: small size, clear description with affected item name,
 * optional reason field, danger button for destructive actions.
 */
export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  reasonLabel,
  reasonPlaceholder = 'Lý do...',
  reasonValue = '',
  onReasonChange,
  reasonError,
  reasonMaxLength,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  confirmVariant = 'danger',
  confirmDisabled = false,
  hideCancel = false,
  isLoading = false,
  onConfirm,
  children,
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="gap-0 p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogBody className="px-6 pb-4 space-y-4">
          {children}
          {reasonLabel && onReasonChange && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reason-confirm" className="text-sm font-medium">
                {reasonLabel}
              </label>
              <Textarea
                id="reason-confirm"
                placeholder={reasonPlaceholder}
                value={reasonValue}
                onChange={(e) => onReasonChange(e.target.value)}
                rows={2}
                maxLength={reasonMaxLength}
                showCount={reasonMaxLength !== undefined}
                aria-invalid={reasonError ? true : undefined}
                aria-describedby={reasonError ? 'reason-confirm-error' : undefined}
              />
              {reasonError ? (
                <p id="reason-confirm-error" role="alert" className="text-xs font-medium text-danger">
                  {reasonError}
                </p>
              ) : null}
            </div>
          )}
        </DialogBody>
        <DialogFooter className="border-t border-border bg-page px-6 py-3">
          {hideCancel ? null : (
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {cancelLabel}
            </Button>
          )}
          <Button
            type="button"
            variant={confirmVariant}
            disabled={isLoading || confirmDisabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
