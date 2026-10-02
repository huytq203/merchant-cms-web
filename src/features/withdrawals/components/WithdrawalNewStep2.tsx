'use client';
import { useCallback, useEffect, useState } from 'react';
import { Button, Card, CardContent, Separator, InputOTP } from '@/components/ui';
import { Shield } from 'lucide-react';
import { format } from 'date-fns';
import type { SubMerchant } from '@/features/sub-merchants/types';
import type { Step1Values } from './WithdrawalNewStep1';

interface WithdrawalNewStep2Props {
  step1: Step1Values;
  subMerchant: SubMerchant;
  onBack: () => void;
  onConfirm: (otp: string) => void;
  isSubmitting?: boolean;
}

const OTP_LENGTH = 6;
const OTP_EXPIRE_SECONDS = 115;
const RESEND_COOLDOWN = 48;

const MOCK_GROSS = 199_984_500;
const MOCK_FEE_RATE = 0.01;
const MOCK_DEPOSIT = 15_350_000;
const MOCK_TX_COUNT = 156;

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  return { display: `${mm}:${ss}`, expired: remaining <= 0, reset: () => setRemaining(seconds) };
}

export function WithdrawalNewStep2({
  step1,
  subMerchant,
  onBack,
  onConfirm,
  isSubmitting,
}: WithdrawalNewStep2Props) {
  const [otpValue, setOtpValue] = useState('');
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const otpTimer = useCountdown(OTP_EXPIRE_SECONDS);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const handleResend = useCallback(() => {
    if (resendCooldown > 0) return;
    setResendCooldown(RESEND_COOLDOWN);
    otpTimer.reset();
    setOtpValue('');
  }, [resendCooldown, otpTimer]);

  const gross = MOCK_GROSS;
  const fee = Math.round(gross * MOCK_FEE_RATE);
  const net = gross - fee - MOCK_DEPOSIT;

  return (
    <div className="space-y-5">

      {/* ── Tóm tắt lệnh rút tiền ──────────────────────── */}
      <Card>
        <CardContent className="space-y-4 pt-5">
          <p className="text-sm font-semibold text-foreground">Tóm tắt lệnh rút tiền</p>
          <Separator />

          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Sub-merchant</p>
              <p className="font-medium">{subMerchant.id} — {subMerchant.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">TK NH nhận</p>
              <p className="font-mono font-medium">
                {subMerchant.bankName} — {subMerchant.accountNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rút đến ngày</p>
              <p className="font-medium">{format(step1.toDate, 'dd/MM/yyyy')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Số giao dịch</p>
              <p className="font-medium">{MOCK_TX_COUNT} giao dịch</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 rounded-lg bg-muted/40 p-3 text-center">
            {[
              { label: 'Gross', value: fmt(gross), color: 'text-foreground' },
              { label: 'Phí rút', value: `- ${fmt(fee)}`, color: 'text-danger' },
              { label: 'Trích ký quỹ', value: `- ${fmt(MOCK_DEPOSIT)}`, color: 'text-danger' },
              { label: 'Chuyển về NH', value: fmt(net), color: 'text-success font-bold' },
            ].map(({ label, value, color }) => (
              <div key={label} className="space-y-1">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className={`text-sm font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── OTP ─────────────────────────────────────────── */}
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              Mã xác nhận OTP đã được gửi tới{' '}
              <span className="font-semibold text-foreground">0912***678</span>
              . Vui lòng nhập mã để hoàn tất yêu cầu rút tiền.
            </span>
          </div>

          <div className="flex justify-center">
            <InputOTP
              length={OTP_LENGTH}
              value={otpValue}
              onChange={setOtpValue}
              inputMode="numeric"
              autoFocus
              disabled={otpTimer.expired}
            />
          </div>

          <div className="space-y-1 text-center text-xs text-muted-foreground">
            {!otpTimer.expired ? (
              <p>
                Mã OTP hết hạn sau:{' '}
                <span className="font-mono font-semibold text-foreground">{otpTimer.display}</span>
              </p>
            ) : (
              <p className="text-danger">Mã OTP đã hết hạn</p>
            )}
            <p>
              Chưa nhận được mã?{' '}
              <Button
              variant='link'
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="font-medium text-primary disabled:cursor-not-allowed disabled:opacity-50 hover:underline"
              >
                Gửi lại mã OTP {resendCooldown > 0 ? `(${resendCooldown}s)` : ''}
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Footer ──────────────────────────────────────── */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Quay lại
        </Button>
        <Button
          type="button"
          leftIcon={<Shield className="h-4 w-4" />}
          disabled={otpValue.length < OTP_LENGTH || otpTimer.expired || isSubmitting}
          isLoading={isSubmitting}
          onClick={() => onConfirm(otpValue)}
        >
          Xác nhận rút tiền
        </Button>
      </div>

    </div>
  );
}
