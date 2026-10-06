"use client";

import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { Textarea } from "@/components/ui/textarea/Textarea";
import { bankDisplayName } from "@/features/bank-accounts/utils/bank-mapper";
import { formatAmount } from "@/lib/utils/helper";
import type { WithdrawalCreateFlow } from "../hooks/use-withdrawal-create-flow";

const SUB_MERCHANT_ACCOUNT_NOTE = "Tài khoản cấp điểm bán chưa dùng được để rút tiền";

type Props = { flow: WithdrawalCreateFlow; onCancel: () => void };

/** Step 1: which sub-merchant and linked bank account to pay out to, and how much. */
export function WithdrawalNewStep1({ flow, onCancel }: Props) {
  const { values, errors, change, subMerchants, bankOptions } = flow;
  const subMerchantOptions = (subMerchants.data ?? []).map((item) => ({
    value: item.id,
    label: `${item.code} — ${item.name}`,
  }));
  const bankSelectOptions = (bankOptions.data?.options ?? []).map((option) => ({
    value: option.id,
    label: `${bankDisplayName(option.bankCode)} ${option.accountNumberMasked} · ${option.accountName}`,
  }));
  const amount = Number(values.amount);
  const bankLoadError = bankOptions.isError ? bankOptions.error.message : undefined;

  return (
    <form onSubmit={flow.review} className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Sub-merchant"
          value={values.subMerchantId}
          onChange={(value) => change("subMerchantId", value)}
          options={subMerchantOptions}
          placeholder="Tất cả (toàn merchant)"
        />
        <Select
          label="Tài khoản ngân hàng nhận tiền"
          value={values.bankAccountId}
          onChange={(value) => change("bankAccountId", value)}
          options={bankSelectOptions}
          placeholder={bankOptions.isPending ? "Đang tải tài khoản..." : "Chọn tài khoản đã liên kết"}
          emptyText="Chưa có tài khoản ngân hàng đã liên kết"
          error={errors.bankAccountId ?? bankLoadError}
          description={bankOptions.data?.hasHiddenSubMerchantAccounts ? SUB_MERCHANT_ACCOUNT_NOTE : undefined}
        />
        <div className="sm:col-span-2">
          <Input
            label="Số tiền rút (VND)"
            placeholder="Nhập số tiền (VND)"
            required
            inputMode="numeric"
            value={values.amount}
            onChange={(event) => change("amount", event.target.value.replace(/\D/g, ""))}
            description={amount > 0 ? formatAmount(amount) : undefined}
            error={errors.amount}
          />
        </div>
        <div className="sm:col-span-2">
          <Textarea
            label="Ghi chú"
            placeholder="Ví dụ: Rút tiền cuối tháng"
            maxLength={500}
            value={values.reason}
            onChange={(event) => change("reason", event.target.value)}
            error={errors.reason}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" variant="solid">
          Tiếp tục
        </Button>
      </div>
    </form>
  );
}
