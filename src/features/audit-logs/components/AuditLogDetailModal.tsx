'use client';

import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog/Dialog';
import { auditLogQueries } from '../audit-log-queries';
import type { AuditLog } from '../types';
import { actionLabel, actorName, categoryLabel, changeLines, entityLabel } from '../utils/audit-mapper';

interface Props {
  row: AuditLog | null;
  onClose: () => void;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function AuditLogDetailModal({ row, onClose }: Props) {
  const detail = useQuery({
    ...auditLogQueries.detail(row?.id ?? ''),
    enabled: Boolean(row),
  });
  const value = detail.data ?? row;

  return (
    <Dialog
      open={Boolean(row)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết nhật ký hệ thống</DialogTitle>
        </DialogHeader>
        {detail.isPending && <p>Đang tải chi tiết...</p>}
        {detail.isError && <p role="alert">{detail.error.message}</p>}
        {value && (
          <div className="space-y-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Field label="Người thực hiện">{actorName(value)}</Field>
              <Field label="Hành động">{actionLabel(value.action)}</Field>
              <Field label="Nhóm">{categoryLabel(value.category)}</Field>
              <Field label="Đối tượng">
                {entityLabel(value.entityName ?? '—')}
                {value.entityDisplayName && <span className="block text-muted-foreground">{value.entityDisplayName}</span>}
              </Field>
              <Field label="Thời gian">{format(new Date(value.occurredAt), 'dd/MM/yyyy HH:mm:ss')}</Field>
              <Field label="Lý do">{value.reason ?? '—'}</Field>
            </dl>
            {/* Nội dung thay đổi (11/11/2026): mỗi trường một dòng; BE đã che SĐT/email/số TK. */}
            {changeLines(value.changeSummary).length > 0 && (
              <div className="text-sm">
                <p className="text-muted-foreground">Nội dung thay đổi</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {changeLines(value.changeSummary).map((line) => <li key={line}>{line}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
