'use client';
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
} from '@/components/ui/sheet/Sheet';
import { Badge } from '@/components/ui/badge/Badge';
import { Separator } from '@/components/ui/separator/Separator';
import { formatAmount, formatDate } from '@/lib/utils/helper';
import { REFUND_STATUS_OPTIONS } from '../constants/Refund.constants';
import type { Refund } from '../types/type';
import { CheckCircle2, DollarSign, FileText, FilePlus2, History, XCircle } from 'lucide-react';
import { Timeline } from '@/components/ui/timeline/Timeline';

interface RefundDetailProps {
  refund: Refund | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}

function InfoRow({ label, value, valueClassName }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm font-medium text-right ${valueClassName ?? 'text-foreground'}`}>
        {value}
      </span>
    </div>
  );
}

interface SectionTitleProps {
  icon: React.ElementType;
  title: string;
}

function SectionTitle({ icon: Icon, title }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
        {title}
      </span>
    </div>
  );
}

function buildHistory(refund: Refund) {
  const base = {
    time: refund.createdAt,
    actor: refund.createdBy ?? 'Hệ thống',
    action: 'Tạo yêu cầu hoàn tiền',
    isFirst: true,
  };

  if (refund.status === 'rejected') {
    return [
      base,
      {
        time: refund.updatedAt ?? refund.createdAt,
        actor: 'admin_super',
        action: 'Admin hệ thống từ chối',
        isFirst: false,
      },
    ];
  }

  if (refund.status === 'approved' || refund.status === 'success') {
    return [
      base,
      {
        time: refund.updatedAt ?? refund.createdAt,
        actor: 'admin_super',
        action: 'Admin hệ thống phê duyệt',
        isFirst: false,
      },
    ];
  }

  return [base];
}

export function RefundDetail({ refund, open, onOpenChange }: RefundDetailProps) {
  const statusOption = refund
    ? REFUND_STATUS_OPTIONS.find((o) => o.value === refund.status)
    : undefined;

  const merchantBears = refund ? refund.actualAmount + refund.feeMb : 0;
  const history = refund ? buildHistory(refund) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg">
        <SheetHeader>
          <div>
            <SheetTitle>Chi tiết hoàn tiền</SheetTitle>
            {refund && (
              <p className="text-sm font-mono font-semibold text-primary mt-0.5">{refund.code}</p>
            )}
          </div>
        </SheetHeader>

        {refund && (
          <SheetBody className="space-y-5">
            <div>
              <Badge
                variant={statusOption?.variant ?? 'outline'}
                size="lg"
                pulse={refund.status === 'pending'}
              >
                {statusOption?.label ?? refund.status}
              </Badge>
            </div>

            <section>
              <SectionTitle icon={DollarSign} title="Thông tin tài chính" />
              <div className="rounded-xl border border-border/60 bg-muted/30 px-4 divide-y divide-border/50">
                <InfoRow label="Số tiền yêu cầu:" value={formatAmount(refund.requestAmount)} />
                <InfoRow label="Phí người bán (MB):" value={formatAmount(refund.feeMb)} />
                <InfoRow
                  label="Thực hoàn khách nhận:"
                  value={formatAmount(refund.actualAmount)}
                  valueClassName="text-danger font-semibold"
                />
                <InfoRow
                  label="Thực hoàn merchant chịu:"
                  value={formatAmount(merchantBears)}
                  valueClassName="text-danger font-semibold"
                />
              </div>
            </section>

            <Separator />

            <section>
              <SectionTitle icon={FileText} title="Thông tin đối soát" />
              <div className="rounded-xl border border-border/60 bg-muted/30 px-4 divide-y divide-border/50">
                <InfoRow
                  label="Mã giao dịch gốc:"
                  value={
                    <span className="font-mono text-primary">{refund.transactionCode}</span>
                  }
                />
                <InfoRow label="Mã hóa đơn:" value={refund.invoiceCode ?? '—'} />
                <InfoRow
                  label="Người nhận:"
                  value={
                    <span>
                      {refund.recipientName}
                      {refund.recipientCard && (
                        <span className="ml-1 text-xs text-muted-foreground font-mono">
                          ({refund.recipientCard})
                        </span>
                      )}
                    </span>
                  }
                />
              </div>
            </section>

            {refund.reason && (
              <>
                <Separator />
                <section>
                  <SectionTitle
                    icon={refund.status === 'rejected' ? XCircle : FileText}
                    title={
                      refund.status === 'rejected'
                        ? 'Lý do từ chối (từ admin)'
                        : 'Lý do hoàn tiền'
                    }
                  />
                  <blockquote
                    className={`rounded-xl border px-4 py-3 text-sm italic leading-relaxed ${
                      refund.status === 'rejected'
                        ? 'border-danger/20 bg-danger/5 text-foreground'
                        : 'border-border/60 bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    &ldquo;{refund.reason}&rdquo;
                  </blockquote>
                </section>
              </>
            )}

            <Separator />

            <section>
              <SectionTitle icon={History} title="Lịch sử xử lý" />
              <Timeline
                size="sm"
                items={history.map((item, index) => {
                  const isLast = index === history.length - 1;
                  const isDanger = isLast && refund.status === 'rejected';
                  return {
                    title: item.action,
                    description: `Bởi ${item.actor}`,
                    time: formatDate(item.time),
                    variant: item.isFirst ? 'primary' : isDanger ? 'danger' : 'success',
                    icon: item.isFirst
                      ? <FilePlus2 />
                      : isDanger
                        ? <XCircle />
                        : <CheckCircle2 />,
                  };
                })}
              />
            </section>
          </SheetBody>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default RefundDetail;
