"use client";

import { Notice } from "@/components/page/Notice";
import { Button } from "@/components/ui/button/Button";
import { Select } from "@/components/ui/select/Select";
import { Textarea } from "@/components/ui/textarea/Textarea";
import { bankDisplayName } from "@/features/bank-accounts/utils/bank-mapper";
import type { WithdrawalCreateFlow } from "../hooks/use-withdrawal-create-flow";
import { WithdrawalBalancePanel } from "./WithdrawalBalancePanel";

type Props = { flow: WithdrawalCreateFlow; onCancel: () => void };

/** Step 1: which Sub account to pay out to. The amount is the Sub's whole ready balance, so it is shown, not typed. */
export function WithdrawalNewStep1({ flow, onCancel }: Props) {
  const { values, errors, change, bankOptions, balance, blocker, selectedBank } = flow;
  const bankSelectOptions = (bankOptions.data?.options ?? []).map((option) => ({
    value: option.id,
    label: `${bankDisplayName(option.bankCode)} ${option.accountNumberMasked} · ${option.accountName}${option.isDefault ? " (mặc định)" : ""}`,
  }));
  const bankLoadError = bankOptions.isError ? bankOptions.error.message : undefined;
  const canContinue = Boolean(balance.data) && !blocker;

  return (
    <form onSubmit={flow.review} className="mt-2 space-y-4">
      <Select
        label="Tài khoản nhận"
        value={values.bankAccountId}
        onChange={(value) => change("bankAccountId", value)}
        options={bankSelectOptions}
        placeholder={bankOptions.isPending ? "Đang tải tài khoản..." : "Chọn tài khoản của Sub-merchant"}
        emptyText="Chưa có tài khoản ngân hàng Sub-merchant đã liên kết"
        error={errors.bankAccountId ?? bankLoadError}
        description="Cổng merchant chỉ rút tiền theo Sub-merchant."
      />
      <WithdrawalBalancePanel balance={balance} hasAccount={Boolean(selectedBank)} blocker={blocker} />
      <Textarea
        label="Ghi chú"
        placeholder="Ví dụ: Rút tiền cuối tháng"
        maxLength={500}
        value={values.reason}
        onChange={(event) => change("reason", event.target.value)}
        error={errors.reason}
      />
      {flow.otpFailure ? <Notice tone="danger">{flow.otpFailure}</Notice> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" variant="solid" disabled={!canContinue}>
          Tiếp tục
        </Button>
      </div>
    </form>
  );
}
