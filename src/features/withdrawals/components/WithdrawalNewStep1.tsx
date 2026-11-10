"use client";

import { Notice } from "@/components/page/Notice";
import { Button } from "@/components/ui/button/Button";
import { Select } from "@/components/ui/select/Select";
import { Textarea } from "@/components/ui/textarea/Textarea";
import { bankDisplayName } from "@/features/bank-accounts/utils/bank-mapper";
import type { WithdrawalCreateFlow } from "../hooks/use-withdrawal-create-flow";
import { WithdrawalBalancePanel } from "./WithdrawalBalancePanel";

type Props = { flow: WithdrawalCreateFlow; onCancel: () => void };

/**
 * Bước 1: chọn Sub-merchant trước, rồi tài khoản nhận của đúng Sub đó. Số tiền là toàn bộ khoản sẵn sàng rút
 * của Sub nên chỉ hiển thị, không nhập. Một tài khoản thì tự chọn và chỉ đọc; nhiều tài khoản thì chọn sẵn mặc định.
 */
export function WithdrawalNewStep1({ flow, onCancel }: Props) {
  const { values, errors, change, bankOptions, balance, blocker, selectedBank, subChoices } = flow;
  const subSelectOptions = subChoices.map((choice) => ({ value: choice.id, label: choice.label }));
  const accountCount = bankOptions.data?.options.length ?? 0;
  const bankSelectOptions = (bankOptions.data?.options ?? []).map((option) => ({
    value: option.id,
    label: `${bankDisplayName(option.bankCode)} ${option.accountNumberMasked} · ${option.accountName}${option.isDefault ? " (mặc định)" : ""}`,
  }));
  const bankLoadError = bankOptions.isError ? bankOptions.error.message : undefined;
  const canContinue = Boolean(selectedBank) && Boolean(balance.data) && !blocker;

  return (
    <form onSubmit={flow.review} className="mt-2 space-y-4">
      <Select
        label="Sub-merchant"
        value={values.subMerchantId}
        onChange={(value) => change("subMerchantId", value)}
        options={subSelectOptions}
        placeholder="Chọn Sub-merchant"
        emptyText="Chưa có Sub-merchant để rút tiền"
        clearable={false}
        error={errors.subMerchantId}
        description="Cổng merchant chỉ rút tiền theo Sub-merchant."
      />
      {values.subMerchantId && bankOptions.isPending ? (
        <p className="text-sm text-muted-foreground">Đang tải tài khoản nhận...</p>
      ) : null}
      {bankLoadError ? <Notice tone="danger">{bankLoadError}</Notice> : null}
      {bankOptions.isSuccess && accountCount === 0 ? (
        <Notice tone="warning">Sub-merchant chưa có tài khoản nhận tiền đã liên kết</Notice>
      ) : null}
      {accountCount === 1 && selectedBank ? (
        <dl aria-label="Tài khoản nhận" className="rounded-xl border border-border bg-card p-4 text-sm">
          <dt className="text-muted-foreground">Tài khoản nhận</dt>
          <dd className="font-medium">
            {bankDisplayName(selectedBank.bankCode)} {selectedBank.accountNumberMasked}
          </dd>
          <dd className="text-muted-foreground">{selectedBank.accountName}</dd>
        </dl>
      ) : null}
      {accountCount > 1 ? (
        <Select
          label="Tài khoản nhận"
          value={values.bankAccountId}
          onChange={(value) => change("bankAccountId", value)}
          options={bankSelectOptions}
          placeholder="Chọn tài khoản của Sub-merchant"
          clearable={false}
          error={errors.bankAccountId}
        />
      ) : null}
      <WithdrawalBalancePanel balance={balance} hasSub={Boolean(values.subMerchantId)} blocker={blocker} />
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
