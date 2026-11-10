"use client";

import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { Textarea } from "@/components/ui/textarea/Textarea";
import { BANK_OPTIONS } from "@/features/bank-accounts/constants/bank-options";
import type { RefundCreateFlow } from "../hooks/use-refund-create-flow";

interface Props {
  flow: RefundCreateFlow;
  orderAmount: number;
  subMerchantName: string;
}

const bankOptions = BANK_OPTIONS.map((bank) => ({ value: bank.value, label: bank.label }));

/** Two groups: what is refunded, and the customer's account the money goes back to. */
export function RefundCreateFields({ flow, orderAmount, subMerchantName }: Props) {
  const { values, errors, change } = flow;
  return (
    <div className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="mb-3 text-sm font-semibold">Khoản hoàn</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Số tiền hoàn (vnđ)"
            placeholder="Nhập số tiền cần hoàn"
            inputMode="numeric"
            value={values.amount}
            onChange={(event) => change("amount", event.target.value)}
            error={errors.amount}
            description={`Không vượt quá ${new Intl.NumberFormat("vi-VN").format(orderAmount)} vnđ giá trị đơn hàng.`}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Trừ vào</span>
            <span className="flex min-h-10 items-center text-sm">Số dư khả dụng của {subMerchantName}</span>
          </div>
        </div>
        <Textarea
          label="Lý do"
          placeholder="Ví dụ: khách trả hàng, đã xác nhận với cửa hàng"
          maxLength={500}
          showCount
          value={values.reason}
          onChange={(event) => change("reason", event.target.value)}
          error={errors.reason}
        />
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="mb-3 text-sm font-semibold">Tài khoản nhận tiền của khách</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Ngân hàng"
            placeholder="Chọn ngân hàng nhận"
            options={bankOptions}
            value={values.beneficiaryBankCode}
            onChange={(value) => change("beneficiaryBankCode", value)}
            error={errors.beneficiaryBankCode}
          />
          <Input
            label="Số tài khoản"
            placeholder="Nhập số tài khoản của khách"
            inputMode="numeric"
            value={values.beneficiaryAccountNumber}
            onChange={(event) => change("beneficiaryAccountNumber", event.target.value)}
            error={errors.beneficiaryAccountNumber}
          />
        </div>
        <Input
          label="Tên chủ tài khoản"
          placeholder="Nhập tên in trên tài khoản, không dấu"
          autoCapitalize="characters"
          value={values.beneficiaryAccountName}
          onChange={(event) => change("beneficiaryAccountName", event.target.value)}
          error={errors.beneficiaryAccountName}
        />
      </fieldset>
    </div>
  );
}
