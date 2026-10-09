"use client";

import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { Textarea } from "@/components/ui/textarea/Textarea";
import { bankDisplayName } from "@/features/bank-accounts/utils/bank-mapper";
import type { WithdrawalCreateFlow } from "../hooks/use-withdrawal-create-flow";
import { WithdrawalBalanceTiles } from "./WithdrawalBalanceTiles";

const SUB_MERCHANT_ACCOUNT_NOTE = "Tài khoản cấp Sub-merchant chưa dùng được để rút tiền";
const groupDigits = (digits: string) => (digits ? new Intl.NumberFormat("vi-VN").format(Number(digits)) : "");

type Props = { flow: WithdrawalCreateFlow; onCancel: () => void };

/** Step 1: which linked account to pay out to, and how much. */
export function WithdrawalNewStep1({ flow, onCancel }: Props) {
  const { values, errors, change, bankOptions, balance } = flow;
  const bankSelectOptions = (bankOptions.data?.options ?? []).map((option) => ({
    value: option.id,
    label: `${bankDisplayName(option.bankCode)} ${option.accountNumberMasked} · ${option.accountName}${option.isDefault ? " (mặc định)" : ""}`,
  }));
  const bankLoadError = bankOptions.isError ? bankOptions.error.message : undefined;

  return (
    <form onSubmit={flow.review} className="mt-2 space-y-4">
      <WithdrawalBalanceTiles balance={balance} columns={2} />
      <Select
        label="Tài khoản nhận"
        value={values.bankAccountId}
        onChange={(value) => change("bankAccountId", value)}
        options={bankSelectOptions}
        placeholder={bankOptions.isPending ? "Đang tải tài khoản..." : "Chọn tài khoản đã liên kết"}
        emptyText="Chưa có tài khoản ngân hàng đã liên kết"
        error={errors.bankAccountId ?? bankLoadError}
        description={bankOptions.data?.hasHiddenSubMerchantAccounts ? SUB_MERCHANT_ACCOUNT_NOTE : undefined}
      />
      <div className="space-y-1.5">
        <Input
          label="Số tiền rút (VND)"
          placeholder="Ví dụ: 10.000.000"
          required
          inputMode="numeric"
          value={groupDigits(values.amount)}
          onChange={(event) => change("amount", event.target.value.replace(/\D/g, ""))}
          error={errors.amount}
        />
        {balance.data ? (
          <Button type="button" variant="link" size="sm" onClick={flow.fillMaximum}>
            Rút tối đa
          </Button>
        ) : null}
      </div>
      <Textarea
        label="Ghi chú"
        placeholder="Ví dụ: Rút tiền cuối tháng"
        maxLength={500}
        value={values.reason}
        onChange={(event) => change("reason", event.target.value)}
        error={errors.reason}
      />
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
