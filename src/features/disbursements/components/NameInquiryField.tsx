"use client";

import { Notice } from "@/components/page/Notice";
import { Button } from "@/components/ui/button/Button";
import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { DISBURSEMENT_BANK_OPTIONS } from "../constants/disbursement-banks";
import type { DisbursementCreateFlow } from "../hooks/use-disbursement-create-flow";

/**
 * Người nhận + tra tên bắt buộc. Tên khai báo là tuỳ chọn, chỉ để đối chiếu với tên ngân hàng: khác tên thì phải tick
 * xác nhận chuyển cho chủ tài khoản theo ngân hàng; không tìm được tài khoản hay chưa tra được thì không đi tiếp.
 */
export function NameInquiryField({ flow }: { flow: DisbursementCreateFlow }) {
  const { values, errors, inquiry } = flow;
  const locked = flow.outcomeUnknown;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Ngân hàng nhận"
          placeholder="Chọn ngân hàng"
          value={values.bankCode}
          onChange={(value) => flow.change("bankCode", value)}
          options={[...DISBURSEMENT_BANK_OPTIONS]}
          clearable={false}
          disabled={locked}
          error={errors.bankCode}
        />
        <Input
          label="Số tài khoản nhận"
          placeholder="Ví dụ: 0123456789"
          inputMode="numeric"
          disabled={locked}
          maxLength={50}
          value={values.accountNumber}
          onChange={(event) => flow.change("accountNumber", event.target.value)}
          error={errors.accountNumber}
        />
      </div>
      <Input
        label="Tên người nhận (không bắt buộc)"
        placeholder="Nhập để đối chiếu với tên chủ tài khoản ở ngân hàng"
        maxLength={255}
        disabled={locked}
        value={values.accountName}
        onChange={(event) => flow.change("accountName", event.target.value)}
        error={errors.accountName}
      />
      <div className="flex justify-end">
        <Button type="button" variant="outline" isLoading={flow.isInquiring} disabled={locked} onClick={() => void flow.inquire()}>
          Tra tên người nhận
        </Button>
      </div>
      {inquiry?.status === "VERIFIED" ? (
        <Notice tone="success">{`Chủ tài khoản: ${inquiry.bankAccountName ?? ""}`}</Notice>
      ) : null}
      {inquiry?.status === "NAME_MISMATCH" ? (
        <div className="space-y-2">
          <Notice tone="warning">{`Tên bạn nhập khác tên chủ tài khoản ở ngân hàng: ${inquiry.bankAccountName ?? ""}.`}</Notice>
          <Checkbox
            checked={flow.mismatchAccepted}
            disabled={locked}
            onCheckedChange={(checked) => flow.acceptMismatch(Boolean(checked))}
            label={`Tôi xác nhận chuyển cho chủ tài khoản ${inquiry.bankAccountName ?? ""}`}
          />
        </div>
      ) : null}
      {inquiry?.status === "UNKNOWN" ? (
        <Notice tone="danger">Chưa tra được tên chủ tài khoản nên chưa thể tạo lệnh. Vui lòng thử lại sau.</Notice>
      ) : null}
    </div>
  );
}
