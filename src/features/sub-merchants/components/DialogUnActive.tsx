'use client';

import { DialogActive, type ReasonDialogProps } from './DialogActive';

export function DialogUnActive(props: Omit<ReasonDialogProps, 'title'>) {
  return <DialogActive {...props} title="Mở khóa điểm bán" />;
}
