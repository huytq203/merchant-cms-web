"use client";

import { DetailItem, DetailList, DetailModal, DetailSection } from "@/components/modal";
import { Notice } from "@/components/page/Notice";
import { StepProgress } from "@/components/page/StepProgress";
import { bankDisplayName } from "@/features/bank-accounts/utils/bank-mapper";
import { formatAmount, formatDate } from "@/lib/utils/helper";
import { EMPTY_VALUE, REQUEST_TYPE_LABELS } from "../constants/Withdrawal.constants";
import { useWithdrawalDetail } from "../hooks/use-withdrawal-detail";
import type { Withdrawal } from "../types/types";
import { WITHDRAWAL_STEPS, withdrawalNote, withdrawalStepStates } from "../utils/withdrawal-timeline";
import { withdrawalTotalDebit } from "../utils/withdrawal-mapper";
import { WithdrawalStatusBadge } from "./WithdrawalStatusBadge";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; listed: Withdrawal | null };

const money = (value: number | null) => (value === null ? EMPTY_VALUE : formatAmount(value));

function WithdrawalSections({ withdrawal }: { withdrawal: Withdrawal }) {
  const note = withdrawalNote(withdrawal.status);
  return (
    <div className="space-y-4">
      <div className="space-y-1 rounded-xl bg-secondary p-4">
        <p className="font-mono text-2xl font-bold tabular-nums text-brand-ink">{formatAmount(withdrawal.amount)}</p>
        <p className="text-sm text-muted-foreground">
          Phí <b className="font-mono text-foreground">{money(withdrawal.fee)}</b> · Tổng trừ ví{" "}
          <b className="font-mono text-foreground">{money(withdrawalTotalDebit(withdrawal))}</b>
        </p>
      </div>
      <StepProgress
        label="Tiến trình yêu cầu"
        steps={WITHDRAWAL_STEPS}
        states={withdrawalStepStates(withdrawal.status)}
      />
      <Notice tone={note.tone}>{note.text}</Notice>
      <DetailSection title="Thông tin yêu cầu">
        <DetailList>
          <DetailItem label="Tài khoản nhận">
            {bankDisplayName(withdrawal.bankCode)} {withdrawal.bankAccountMasked}
          </DetailItem>
          <DetailItem label="Chủ tài khoản">{withdrawal.bankAccountName}</DetailItem>
          <DetailItem label="Hình thức">{REQUEST_TYPE_LABELS[withdrawal.requestType]}</DetailItem>
          <DetailItem label="Ngày yêu cầu">{formatDate(withdrawal.createdAt)}</DetailItem>
          {/* Chưa chắc môi trường thật có trả mã tham chiếu NH (05/11): không có mã thì ẩn cả dòng,
              không hiện "Chưa có" để merchant khỏi tưởng lệnh còn thiếu bước. */}
          {withdrawal.bankRefId ? (
            <DetailItem label="Mã tham chiếu ngân hàng">{withdrawal.bankRefId}</DetailItem>
          ) : null}
          <DetailItem label="Cập nhật lần cuối">{formatDate(withdrawal.updatedAt)}</DetailItem>
          <DetailItem label="Ghi chú" wide>
            {withdrawal.reason ?? EMPTY_VALUE}
          </DetailItem>
        </DetailList>
      </DetailSection>
    </div>
  );
}

export function WithdrawalDetailModal({ open, onOpenChange, listed }: Props) {
  const { withdrawal, loadError } = useWithdrawalDetail(listed);
  return (
    <DetailModal
      open={open}
      onOpenChange={onOpenChange}
      header={{
        monogramInitials: "RT",
        title: "Chi tiết yêu cầu rút tiền",
        code: withdrawal?.transactionCode ?? "Chờ cấp mã",
        statusBadge: withdrawal ? <WithdrawalStatusBadge status={withdrawal.status} /> : undefined,
      }}
      sections={
        <>
          {withdrawal ? <WithdrawalSections withdrawal={withdrawal} /> : null}
          {loadError ? <Notice tone="danger">{loadError}</Notice> : null}
        </>
      }
    />
  );
}
