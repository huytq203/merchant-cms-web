"use client";

import { Notice } from "@/components/page/Notice";
import { StatusBadge } from "@/components/page/StatusBadge";
import { Button } from "@/components/ui/button/Button";
import { Select } from "@/components/ui/select/Select";
import { Textarea } from "@/components/ui/textarea/Textarea";
import { bankAccountStatusLabel, bankAccountStatusTone, bankDisplayName } from "@/features/bank-accounts/utils/bank-mapper";
import type { WithdrawalCreateFlow } from "../hooks/use-withdrawal-create-flow";
import { WithdrawalBalancePanel } from "./WithdrawalBalancePanel";

type Props = { flow: WithdrawalCreateFlow; onCancel: () => void };

/**
 * Bước 1: chọn Sub-merchant. SRS v2 (18/11/2026): mỗi Sub đúng 1 TK nên TK nhận là TK đang gán cho Sub, chỉ hiển thị.
 * Số tiền là toàn bộ khoản sẵn sàng rút của Sub nên chỉ hiển thị, không nhập. Sub chưa gán TK thì không đi tiếp được;
 * lý do (BE 5736) hoặc TK bị khóa (5738) hiện nguyên văn ở khung số dư.
 */
export function WithdrawalNewStep1({ flow, onCancel }: Props) {
  const { values, errors, change, receivingAccount, account, balance, blocker, subChoices } = flow;
  const subSelectOptions = subChoices.map((choice) => ({ value: choice.id, label: choice.label }));
  const accountLoadError = receivingAccount.isError ? receivingAccount.error.message : undefined;
  const canContinue = Boolean(account) && Boolean(balance.data) && !blocker;

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
      {values.subMerchantId && receivingAccount.isPending ? (
        <p className="text-sm text-muted-foreground">Đang tải tài khoản nhận...</p>
      ) : null}
      {accountLoadError ? <Notice tone="danger">{accountLoadError}</Notice> : null}
      {receivingAccount.isSuccess ? (
        <dl aria-label="Tài khoản nhận" className="rounded-xl border border-border bg-card p-4 text-sm">
          <dt className="text-muted-foreground">Tài khoản nhận</dt>
          {account ? (
            <>
              <dd className="flex flex-wrap items-center gap-2 font-medium">
                {bankDisplayName(account.bankCode)} {account.accountNumberMasked}
                <StatusBadge label={bankAccountStatusLabel(account.accountStatus)} tone={bankAccountStatusTone(account.accountStatus)} />
              </dd>
              <dd className="text-muted-foreground">{account.accountName}</dd>
            </>
          ) : (
            <dd className="font-medium">Sub-merchant chưa được gán tài khoản ngân hàng</dd>
          )}
        </dl>
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
