'use client';

import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog/Dialog';
import { auditLogQueries } from '../audit-log-queries';
import type { AuditLog } from '../types';
import { actionLabel, actorName, categoryLabel, entityLabel } from '../utils/audit-mapper';

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
              <Field label="Đối tượng">{entityLabel(value.entityName ?? '—')}</Field>
              <Field label="Thời gian">{format(new Date(value.occurredAt), 'dd/MM/yyyy HH:mm:ss')}</Field>
              <Field label="Lý do">{value.reason ?? '—'}</Field>
            </dl>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
