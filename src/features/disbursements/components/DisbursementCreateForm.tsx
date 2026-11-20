"use client";

import { Notice } from "@/components/page/Notice";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { Textarea } from "@/components/ui/textarea/Textarea";
import { DESCRIPTION_MAX, REQUEST_CODE_MAX } from "../schemas/disbursement.schema";
import type { DisbursementCreateFlow } from "../hooks/use-disbursement-create-flow";
import { NameInquiryField } from "./NameInquiryField";
import { UnconfirmedOrderNotice } from "./UnconfirmedOrderNotice";

/**
 * Bước 1 của lệnh đơn lẻ: mã yêu cầu (sinh sẵn, sửa được), người nhận + tra tên, số tiền, nội dung. Lý do/nội dung chỉ
 * giới hạn độ dài. "Tiếp tục" bị khóa tới khi tra tên xong (hoặc đã tick xác nhận khi tên khác).
 */
export function DisbursementCreateForm({ flow }: { flow: DisbursementCreateFlow }) {
  const { values, errors } = flow;
  // Lệnh trước chưa xác nhận: mã YC + nội dung bị khoá, chỉ còn tra lại / xin OTP mới ở bước xem lại.
  const locked = flow.outcomeUnknown;
  const nameGate = flow.inquiry === null || flow.inquiry.status === "UNKNOWN" || (flow.inquiry.status === "NAME_MISMATCH" && !flow.mismatchAccepted);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void flow.review();
      }}
      className="space-y-4"
    >
      {locked ? (
        <UnconfirmedOrderNotice onLookup={() => void flow.checkExisting()} isLookingUp={flow.isLookingUp} canAbandon={flow.canAbandon} onAbandon={flow.abandonUnconfirmed} />
      ) : null}
      <Input
        label="Mã yêu cầu"
        placeholder="Mã duy nhất của lệnh trong hệ thống của bạn"
        maxLength={REQUEST_CODE_MAX}
        disabled={locked}
        value={values.merchantRequestCode}
        onChange={(event) => flow.change("merchantRequestCode", event.target.value)}
        error={errors.merchantRequestCode}
        description="Gửi lại cùng mã sẽ nhận lại lệnh cũ, không tạo lệnh thứ hai."
      />
      <NameInquiryField flow={flow} />
      <Input
        label="Số tiền chi (VND)"
        placeholder="Ví dụ: 1.000.000"
        inputMode="numeric"
        disabled={locked}
        value={values.amount}
        onChange={(event) => flow.change("amount", event.target.value)}
        error={errors.amount}
      />
      <Textarea
        label="Nội dung chi"
        placeholder="Nội dung hiển thị cho người nhận (không bắt buộc)"
        maxLength={DESCRIPTION_MAX}
        disabled={locked}
        value={values.description}
        onChange={(event) => flow.change("description", event.target.value)}
        error={errors.description}
      />
      {flow.failure ? <Notice tone="danger">{flow.failure}</Notice> : null}
      <div className="flex justify-end">
        <Button type="submit" variant="solid" isLoading={flow.isPreviewing} disabled={nameGate}>
          Tiếp tục
        </Button>
      </div>
    </form>
  );
}
