'use client';

import type { FormEvent, ReactNode } from 'react';
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

export interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Form body; usually a `FormModalGrid` of `FormModalField`s. */
  children: ReactNode;
  /** Backend failure shown inside the body with role="alert". */
  error?: string;
  /** Muted note on the left of the footer, for example the number of selected items. */
  footerNote?: ReactNode;
  submitLabel?: string;
  savingLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  /** Blocks saving without the "saving" label, for example when the form is read-only. */
  submitDisabled?: boolean;
  onSubmit: () => void;
}

/** Create/edit modal: fixed header and footer, body scrolls on its own. */
export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  children,
  error,
  footerNote,
  submitLabel = 'Lưu',
  savingLabel = 'Đang lưu',
  cancelLabel = 'Hủy',
  isSubmitting = false,
  submitDisabled = false,
  onSubmit,
}: FormModalProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSubmitting) onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size={size} className="gap-0 p-0">
        <DialogHeader className="px-6 pr-12 pt-6">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form noValidate onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="px-6 pb-5">
            {children}
            {error ? (
              <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter className="border-t border-border bg-page px-6 py-3">
            {footerNote ? (
              <span className="text-sm tabular-nums text-muted-foreground sm:mr-auto">{footerNote}</span>
            ) : null}
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {cancelLabel}
            </Button>
            <Button type="submit" variant="solid" disabled={isSubmitting || submitDisabled}>
              {isSubmitting ? savingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
