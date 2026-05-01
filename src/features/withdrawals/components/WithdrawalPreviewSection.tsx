'use client';
import { useState } from 'react';
import { Card, CardContent, Checkbox, Badge } from '@/components/ui';
import { Separator } from '@/components/ui/separator/Separator';
import { ChevronDown, ChevronRight, Landmark } from 'lucide-react';
import { format } from 'date-fns';
import type { SubMerchant } from '@/features/sub-merchants/types';

interface PreviewData {
  gross: number;
  txFee: number;
  refund: number;
  withdrawFee: number;
  deposit: number;
  txCount: number;
  fromDate: Date;
  toDate: Date;
}

interface WithdrawalPreviewSectionProps {
  subMerchant: SubMerchant;
  data: PreviewData;
  confirmed: boolean;
  onConfirmedChange: (v: boolean) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN').format(n) + ' VND';

interface LineItemProps {
  label: string;
  sub?: string;
  value: string;
  bold?: boolean;
  danger?: boolean;
}

function LineItem({ label, sub, value, bold, danger }: LineItemProps) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className={`text-sm ${bold ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
        {label}
        {sub && <span className="ml-1 text-xs text-muted-foreground/70">{sub}</span>}
      </span>
      <span className={`font-mono text-sm ${bold ? 'font-bold text-foreground' : ''} ${danger ? 'text-danger' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export function WithdrawalPreviewSection({
  subMerchant,
  data,
  confirmed,
  onConfirmedChange,
}: WithdrawalPreviewSectionProps) {
  const [txExpanded, setTxExpanded] = useState(false);

  const { gross, txFee, refund, withdrawFee, deposit, txCount, fromDate, toDate } = data;
  const netBeforeDeposit = gross - withdrawFee;
  const netTransfer = netBeforeDeposit - deposit;

  return (
    <Card className="border-primary/20">
      <CardContent className="space-y-4 pt-5">
        {/* ── Section header ──────────────────────────────── */}
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
            B
          </span>
          <p className="font-semibold text-foreground">Kết quả tính toán</p>
        </div>

        {/* ── Badges ──────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="soft-primary">
            {txCount} giao dịch đủ điều kiện
          </Badge>
          <span className="text-xs text-muted-foreground">
            Từ {format(fromDate, 'dd/MM/yyyy')} đến {format(toDate, 'dd/MM/yyyy')}
          </span>
        </div>

        <Separator />

        {/* ── Line items ──────────────────────────────────── */}
        <div className="space-y-0.5">
          <LineItem label="Tổng doanh thu gốc" sub="(chưa trừ phí)" value={fmt(gross + txFee + refund)} />
          <LineItem label="Phí giao dịch gốc" sub="(đã trừ khi thanh toán)" value={`- ${fmt(txFee)}`} danger />
          <LineItem label="Hoàn tiền đã phát sinh" value={`- ${fmt(refund)}`} danger />
        </div>

        <Separator />

        <div className="space-y-0.5">
          <LineItem label="Tổng thực nhận từ giao dịch (Gross)" value={fmt(gross)} bold />
          <LineItem label="Phí rút tiền" sub="(1% trên Gross)" value={`- ${fmt(withdrawFee)}`} danger />
        </div>

        <Separator />

        <div className="space-y-0.5">
          <LineItem label="Số tiền sau phí (Net)" value={fmt(netBeforeDeposit)} bold />
          <LineItem label="Trích ký quỹ" sub={`(còn thiếu ${fmt(deposit)})`} value={`- ${fmt(deposit)}`} danger />
        </div>

        {/* ── Net transfer highlight ───────────────────────── */}
        <div className="flex items-center justify-between rounded-lg bg-primary/5 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-primary">
            <Landmark className="h-4 w-4" />
            Số tiền thực chuyển về ngân hàng
          </span>
          <span className="font-mono text-base font-bold text-foreground">{fmt(netTransfer)}</span>
        </div>

        {/* ── Collapsible tx list ──────────────────────────── */}
        <button
          type="button"
          onClick={() => setTxExpanded((v) => !v)}
          className="flex w-full items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-primary hover:bg-muted/40"
        >
          {txExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {txCount} giao dịch — Nhấn để xem chi tiết
        </button>
        {txExpanded && (
          <p className="px-1 text-xs text-muted-foreground">
            (Danh sách giao dịch chi tiết sẽ được hiển thị khi API sẵn sàng)
          </p>
        )}

        <Separator />

        {/* ── Confirmation checkbox ────────────────────────── */}
        <Checkbox
          checked={confirmed}
          onCheckedChange={(v) => onConfirmedChange(!!v)}
          label={
            <span className="text-sm text-muted-foreground">
              Tôi đã kiểm tra và xác nhận thông tin rút tiền ở trên là chính xác. Số tiền{' '}
              <span className="font-semibold text-foreground">{fmt(netTransfer)}</span>{' '}
              sẽ được chuyển về tài khoản{' '}
              <span className="font-semibold text-foreground">
                {subMerchant.bankName} — {subMerchant.accountNumber}
              </span>
              . Trích ký quỹ: <span className="font-semibold text-foreground">{fmt(deposit)}</span>.
            </span>
          }
        />
      </CardContent>
    </Card>
  );
}
