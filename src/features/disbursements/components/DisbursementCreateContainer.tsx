"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card/Card";
import { SegmentedControl } from "@/components/form/SegmentedControl";
import { useDisbursementCreateFlow } from "../hooks/use-disbursement-create-flow";
import { BatchUpload } from "./BatchUpload";
import { DisbursementCreateForm } from "./DisbursementCreateForm";
import { DisbursementOtpStep } from "./DisbursementOtpStep";
import { DisbursementPreviewPanel } from "./DisbursementPreviewPanel";
import { DisbursementResult } from "./DisbursementResult";

type Mode = "single" | "batch";
type Props = { subId: string; modes: { single: boolean; batch: boolean } };

/** Lệnh đơn lẻ: nhập → xem lại → OTP → kết quả. Đổi Sub (trên URL) dựng lại container nên không giữ gì của Sub cũ. */
function SingleFlow({ subId, onCreateAnother, onUnconfirmedChange }: {
  subId: string;
  onCreateAnother: () => void;
  onUnconfirmedChange: (unconfirmed: boolean) => void;
}) {
  const flow = useDisbursementCreateFlow(subId);
  // Báo lên container để khoá bộ chọn Đơn lẻ/Theo lô: chuyển hình thức làm unmount luồng này khi lệnh chưa xác nhận.
  const unconfirmed = flow.outcomeUnknown;
  useEffect(() => {
    onUnconfirmedChange(unconfirmed);
    return () => onUnconfirmedChange(false);
  }, [unconfirmed, onUnconfirmedChange]);
  if (flow.step === "result" && flow.result) {
    return <DisbursementResult view={flow.result} onCreateAnother={onCreateAnother} />;
  }
  if (flow.step === "otp" && flow.challenge) {
    return (
      <DisbursementOtpStep
        challenge={flow.challenge}
        purpose="lệnh chi hộ"
        submitLabel="Gửi lệnh"
        failure={flow.failure}
        unconfirmed={flow.outcomeUnknown}
        isSubmitting={flow.isSending}
        isResending={flow.isRequestingCode}
        onSubmit={(otp) => void flow.confirm(otp)}
        onResend={() => void flow.sendCode()}
        onBack={flow.back}
        onLookup={() => void flow.checkExisting()}
        isLookingUp={flow.isLookingUp}
        canAbandon={flow.canAbandon}
        onAbandon={flow.abandonUnconfirmed}
      />
    );
  }
  if (flow.step === "review") return <DisbursementPreviewPanel flow={flow} />;
  return <DisbursementCreateForm flow={flow} />;
}

/** Chọn hình thức (đơn lẻ/lô) theo cấu hình của Sub; chỉ một hình thức được bật thì không hiện bộ chọn. */
export function DisbursementCreateContainer({ subId, modes }: Props) {
  const [mode, setMode] = useState<Mode>(modes.single ? "single" : "batch");
  // Tăng khi người dùng bấm "Tạo lệnh khác": dựng lại luồng để sinh mã yêu cầu mới và xóa form.
  const [round, setRound] = useState(0);
  // Đang có lệnh đơn lẻ chưa xác nhận (có thể đã chi): không cho đổi hình thức, tránh bỏ dở rồi tạo lệnh khác.
  const [unconfirmed, setUnconfirmed] = useState(false);
  return (
    <Card padding="md" className="space-y-4">
      {modes.single && modes.batch ? (
        <SegmentedControl
          ariaLabel="Hình thức chi hộ"
          options={[{ value: "single", label: "Đơn lẻ" }, { value: "batch", label: "Theo lô" }]}
          value={mode}
          onChange={setMode}
          disabled={unconfirmed}
        />
      ) : null}
      {mode === "single" && modes.single ? <SingleFlow key={round} subId={subId} onCreateAnother={() => setRound((value) => value + 1)} onUnconfirmedChange={setUnconfirmed} /> : null}
      {mode === "batch" && modes.batch ? <BatchUpload subId={subId} /> : null}
    </Card>
  );
}
