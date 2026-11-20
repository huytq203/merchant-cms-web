import type { BankAccount } from "@/features/bank-accounts/types";
import { bankDisplayName } from "@/features/bank-accounts/utils/bank-mapper";
import { EMPTY_VALUE, POCKET_ORDER_LABELS, POCKET_SOURCE_LABELS } from "../constants/Withdrawal.constants";
import type { Withdrawal, WithdrawalCreateBody, WithdrawalPocket, WithdrawalStatus } from "../schemas/withdrawal.schema";
import type { WithdrawalReceivingAccount } from "../types/types";

/** The portal only creates requests; a PENDING one still waits for the checker. */
export function isAwaitingApproval(status: WithdrawalStatus): boolean {
  return status === "PENDING";
}

export type WithdrawalBreakdown = {
  /** Escrow setoff, inside the amount. */
  setoff: number;
  fee: number | null;
  /** What reaches the bank account; null while the fee is unknown and BE sent no net. */
  net: number | null;
  /** Only for an old ADD_ON request, whose wallet was charged amount + fee; null for every Sub request. */
  totalDebit: number | null;
};

/**
 * How a request's amount splits. Every Sub request is DEDUCT: setoff and fee come OUT of the amount (the fee is worked
 * out on what is left after the setoff), so net = amount − setoff − fee and nothing is added on top — showing
 * "amount + fee" as a wallet total was wrong for them (FM26I4MEO, 11/11/2026). Only an old ADD_ON request had the fee
 * charged on top, so only it keeps a wallet total. BE's own net (`receivedAmount`) wins when sent.
 */
export function withdrawalBreakdown(
  withdrawal: Pick<Withdrawal, "amount" | "fee" | "setoffAmount" | "netReceived" | "payoutFeeMode">,
): WithdrawalBreakdown {
  const { amount, fee, setoffAmount: setoff, payoutFeeMode } = withdrawal;
  const addOn = payoutFeeMode === "ADD_ON";
  const computed = addOn ? amount - setoff : fee === null ? null : amount - setoff - fee;
  return {
    setoff,
    fee,
    net: withdrawal.netReceived ?? computed,
    totalDebit: addOn && fee !== null ? amount + fee : null,
  };
}

/**
 * BE reads merchant, bank and account holder from the stored account, so only these fields leave the browser. SRS v2:
 * the Sub names the request (an account may serve several Subs); the account id is sent only when known.
 */
export function toWithdrawalCreateRequest(body: WithdrawalCreateBody) {
  return {
    subMerchantId: body.subMerchantId,
    ...(body.bankAccountId ? { bankAccountId: body.bankAccountId } : {}),
    ...(body.pocket ? { pocket: body.pocket } : {}),
    amount: body.amount,
    idempotencyKey: body.idempotencyKey,
    sensitiveOtp: body.otp,
    ...(body.reason ? { reason: body.reason } : {}),
    ...(body.confirmZeroNet ? { confirmZeroNet: true } : {}),
  };
}

/**
 * The account shown (not chosen) in the create form. SRS v2 drops every FE check on the account state: a pending
 * account pays out, and a locked one is refused by BE (5738) with a Vietnamese message the screen shows as is.
 */
export function toReceivingAccount(
  account: Pick<BankAccount, "id" | "bankCode" | "accountNumber" | "accountName" | "accountStatus">,
): WithdrawalReceivingAccount {
  return {
    id: account.id,
    bankCode: account.bankCode,
    accountNumberMasked: account.accountNumber,
    accountName: account.accountName,
    accountStatus: account.accountStatus,
  };
}

type TitledWithdrawal = Pick<Withdrawal, "transactionCode" | "bankCode" | "bankAccountMasked">;

/** How a request is named in actions and dialogs: its code once issued, otherwise bank and masked number. */
export function withdrawalTitle(withdrawal: TitledWithdrawal): string {
  const bank = `${bankDisplayName(withdrawal.bankCode)} ${withdrawal.bankAccountMasked}`;
  return withdrawal.transactionCode ?? bank;
}

/**
 * Cột "Loại lệnh": tên BE gửi theo ngăn ("Yêu cầu chi tiền" / "Lệnh rút"). Lệnh trước GĐ6 không có ngăn nên hiện dấu "—"
 * (không đoán), BE gửi ngăn mà thiếu tên thì dùng tên FE biết.
 */
export function orderTypeLabel(withdrawal: Pick<Withdrawal, "pocket" | "pocketLabel">): string {
  const label = withdrawal.pocketLabel?.trim();
  if (label) return label;
  return withdrawal.pocket ? POCKET_ORDER_LABELS[withdrawal.pocket] : EMPTY_VALUE;
}

/** Dòng "Nguồn tiền" của chi tiết lệnh: tên ngăn tiền đã bị trừ; lệnh cũ không phân nguồn hiện "—". */
export function pocketSourceLabel(pocket: WithdrawalPocket | null): string {
  return pocket ? POCKET_SOURCE_LABELS[pocket] : EMPTY_VALUE;
}
