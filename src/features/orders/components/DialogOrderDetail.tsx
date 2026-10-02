'use client';
import { useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { Badge } from '@/components/ui/badge/Badge';
import { Button } from '@/components/ui/button/Button';
import { QRCode } from '@/components/ui/qrcode/QRCode';
import { Separator } from '@/components/ui/separator/Separator';
import { formatAmount, formatDate } from '@/lib/utils/helper';
import {
  ORDER_STATUS_OPTIONS,
  ORDER_SOURCE_OPTIONS,
} from '../constants/Order.constants';
import type { Order } from '../types/types';
import {
  Copy,
  Download,
  ExternalLink,
  Store,
  User,
  Calendar,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';

interface DialogOrderDetailProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

export function DialogOrderDetail({ order, open, onOpenChange }: DialogOrderDetailProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback(async () => {
    if (!order?.paymentUrl) return;
    await navigator.clipboard.writeText(order.paymentUrl);
    toast.success('Đã sao chép liên kết thanh toán');
  }, [order]);

  const handleDownloadQR = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `qr-${order?.code ?? 'order'}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [order]);

  if (!order) return null;

  const statusOpt = ORDER_STATUS_OPTIONS.find((o) => o.value === order.status);
  const sourceOpt = ORDER_SOURCE_OPTIONS.find((o) => o.value === order.source);
  const isPaymentLink = order.source === 'payment_link';
  const isPaid = order.status === 'paid';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
       * p-0 overrides the default p-6 so we can control padding per section.
       * flex + flex-col + max-h-[90dvh] = scrollable body, sticky header.
       */}
      <DialogContent className="flex max-h-[90dvh] max-w-lg flex-col gap-0 p-0">

        {/* ── Sticky header ─────────────────────────────────── */}
        <div className="flex-shrink-0 border-b border-border px-6 pb-4 pt-6 pr-12">
          <DialogHeader>
            <DialogTitle className="text-base">
              Chi tiết đơn hàng{' '}
              <span className="font-mono text-primary">#{order.code}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={statusOpt?.variant ?? 'outline'}>
              {statusOpt?.label ?? order.status}
            </Badge>
            <Badge variant={sourceOpt?.variant ?? 'outline'} size="sm">
              {sourceOpt?.label ?? order.source}
            </Badge>
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <InfoRow
                icon={<Store className="h-3.5 w-3.5" />}
                label="Đơn vị thụ hưởng"
                value={order.subMerchantName}
              />
              <InfoRow
                icon={<User className="h-3.5 w-3.5" />}
                label="Người tạo"
                value={order.createdBy ?? 'Hệ thống'}
              />
              <InfoRow
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Thời gian tạo"
                value={formatDate(order.createdAt)}
              />
              {order.transactionCode && (
                <InfoRow
                  icon={<Hash className="h-3.5 w-3.5" />}
                  label="Mã giao dịch"
                  value={<span className="font-mono text-xs">{order.transactionCode}</span>}
                />
              )}
            </div>

            <Separator />

            {/* Amount */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
              <span className="text-sm font-medium text-muted-foreground">Tổng thanh toán</span>
              <span className="text-xl font-bold text-primary">{formatAmount(order.amount)}</span>
            </div>

            {/* QR + Payment URL — chỉ hiện với Payment Link */}
            {isPaymentLink && order.paymentUrl && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Link &amp; QR thanh toán
                  </p>

                  <div className="flex flex-col items-center gap-2">
                    <QRCode
                      ref={qrRef}
                      value={order.paymentUrl}
                      size="lg"
                      level="M"
                      renderer="svg"
                    />
                    <span className="text-sm font-semibold text-primary">
                      {formatAmount(order.amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                    <span className="flex-1 truncate font-mono text-xs text-primary">
                      {order.paymentUrl}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopy}
                      leftIcon={<Copy className="h-3.5 w-3.5" />}
                    >
                      Sao chép
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={handleDownloadQR}
                  >
                    Tải QR
                  </Button>
                </div>
              </>
            )}

            {/* Xem giao dịch — chỉ hiện khi đã thanh toán */}
            {isPaid && order.transactionCode && (
              <button
                type="button"
                className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
                onClick={() => toast.info('Tính năng đang phát triển')}
              >
                Xem chi tiết giao dịch tài chính
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}

          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}

export default DialogOrderDetail;
