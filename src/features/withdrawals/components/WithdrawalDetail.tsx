'use client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
} from '@/components/ui/sheet/Sheet';
import { Badge } from '@/components/ui/badge/Badge';
import { Button } from '@/components/ui/button/Button';
import { Separator } from '@/components/ui/separator/Separator';
import { Card, CardContent } from '@/components/ui/card/Card';
import { formatAmount, formatDate } from '@/lib/utils/helper';
import { WITHDRAWAL_STATUS_OPTIONS } from '../constants/Withdrawal.constants';
import type { Withdrawal } from '../types/types';
import {
  Building2,
  Download,
  AlertCircle,
  Hash,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface WithdrawalDetailProps {
  withdrawal: Withdrawal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LabelValueProps {
  label: string;
  value: React.ReactNode;
}

function LabelValue({ label, value }: LabelValueProps) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

export function WithdrawalDetail({ withdrawal, open, onOpenChange }: WithdrawalDetailProps) {
  const statusOpt = WITHDRAWAL_STATUS_OPTIONS.find((o) => o.value === withdrawal?.status);
  const netAmount = withdrawal ? withdrawal.amount - withdrawal.fee : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg" className="flex flex-col gap-0 p-0">

        {/* ── Header ──────────────────────────────────────────── */}
        <SheetHeader className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="space-y-0.5">
              <SheetTitle className="text-base font-bold uppercase tracking-wide">
                Chi tiết giao dịch rút
              </SheetTitle>
              {withdrawal && (
                <p className="font-mono text-sm text-muted-foreground">
                  Mã: {withdrawal.code}
                </p>
              )}
            </div>
            {withdrawal && (
              <Badge variant={statusOpt?.variant ?? 'outline'} className="mt-0.5 shrink-0">
                {statusOpt?.label ?? withdrawal.status}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* ── Body ────────────────────────────────────────────── */}
        <SheetBody className="flex-1 overflow-y-auto px-6 py-5">
          {!withdrawal ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm">Không tìm thấy dữ liệu</p>
            </div>
          ) : (
            <div className="space-y-4">

              {/* ── Thông tin yêu cầu ─────────────────────────── */}
              <Card>
                <CardContent className="space-y-4 pt-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Thông tin yêu cầu
                  </p>
                  <Separator />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <LabelValue
                      label="Đơn vị yêu cầu"
                      value={
                        <span className="text-primary">
                          {withdrawal.subMerchantShort
                            ? `${withdrawal.subMerchantShort} · `
                            : ''}
                          {withdrawal.subMerchantName}
                        </span>
                      }
                    />
                    <LabelValue
                      label="Mã giao dịch"
                      value={
                        <span className="flex items-center gap-1 font-mono text-xs">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          {withdrawal.code}
                        </span>
                      }
                    />
                    <LabelValue
                      label="Thời gian khởi tạo"
                      value={
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatDate(withdrawal.requestedAt)}
                        </span>
                      }
                    />
                    <LabelValue
                      label="Thời gian hoàn tất"
                      value={
                        withdrawal.updatedAt ? (
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            {formatDate(withdrawal.updatedAt)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* ── Tài khoản thụ hưởng ───────────────────────── */}
              <Card>
                <CardContent className="space-y-4 pt-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Tài khoản thụ hưởng
                  </p>
                  <Separator />
                  <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-bold uppercase text-foreground">
                        {withdrawal.accountName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {withdrawal.bankName}
                        <span className="mx-1.5">·</span>
                        <span className="font-mono">{withdrawal.bankAccount}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── Báo cáo dòng tiền ─────────────────────────── */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="space-y-3 pt-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-primary/70">
                    Báo cáo dòng tiền
                  </p>
                  <Separator className="bg-primary/10" />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tổng tiền rút (Gross)</span>
                      <span className="font-mono font-semibold">{formatAmount(withdrawal.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Phí giao dịch</span>
                      <span className="font-mono font-semibold text-danger">
                        -{formatAmount(withdrawal.fee)}
                      </span>
                    </div>
                  </div>
                  <Separator className="bg-primary/10" />
                  <div className="flex items-end justify-between pt-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Thực nhận về ngân hàng
                    </p>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {new Intl.NumberFormat('vi-VN').format(netAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">VND</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── Actions ───────────────────────────────────── */}
              <Button
                className="w-full"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => toast.info('Tính năng xuất file đang phát triển')}
              >
                Xuất bảng kê chi tiết (.XLSX)
              </Button>

              {/* ── Warning note ──────────────────────────────── */}
              <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Nếu số tiền thực nhận không khớp với sao kê ngân hàng, vui lòng tải bảng kê
                  chi tiết để kiểm tra lại các giao dịch hoàn (Refund) trong kỳ.
                </p>
              </div>

            </div>
          )}
        </SheetBody>

      </SheetContent>
    </Sheet>
  );
}

export default WithdrawalDetail;
