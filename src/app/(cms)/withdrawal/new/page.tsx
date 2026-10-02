'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import { toast } from 'sonner';
import { WithdrawalNewStep1, type Step1Values } from '@/features/withdrawals/components/WithdrawalNewStep1';
import { WithdrawalNewStep2 } from '@/features/withdrawals/components/WithdrawalNewStep2';
import type { SubMerchant } from '@/features/sub-merchants/types';

type Step = 1 | 2;

export default function NewWithdrawalPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
  const [selectedSM, setSelectedSM] = useState<SubMerchant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = (values: Step1Values, sm: SubMerchant) => {
    setStep1Data(values);
    setSelectedSM(sm);
    setStep(2);
  };

  const handleConfirm = async (otp: string) => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSubmitting(false);
    toast.success(`Tạo yêu cầu rút tiền thành công! OTP: ${otp}`);
    router.push('/withdrawal');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* ── Page header ──────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => (step === 2 ? setStep(1) : router.push('/withdrawal'))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tạo yêu cầu rút tiền</h1>
          <p className="text-sm text-muted-foreground">
            Bước {step} / 2 — {step === 1 ? 'Chọn điều kiện' : 'Xác nhận OTP'}
          </p>
        </div>
      </div>

      {/* ── Steps ────────────────────────────────────── */}
      {step === 1 && (
        <WithdrawalNewStep1
          onNext={handleNext}
          onCancel={() => router.push('/withdrawal')}
        />
      )}

      {step === 2 && step1Data && selectedSM && (
        <WithdrawalNewStep2
          step1={step1Data}
          subMerchant={selectedSM}
          onBack={() => setStep(1)}
          onConfirm={handleConfirm}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
