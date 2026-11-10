import type { BankAccount } from "@/features/bank-accounts/types";
import { bankDisplayName } from "@/features/bank-accounts/utils/bank-mapper";
import type { Withdrawal, WithdrawalCreateBody, WithdrawalStatus } from "../schemas/withdrawal.schema";
import type { WithdrawalBankOption } from "../types/types";

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

/** BE reads merchant, bank and account holder from the stored account, so only these fields leave the browser. */
export function toWithdrawalCreateRequest(body: WithdrawalCreateBody) {
  return {
    bankAccountId: body.bankAccountId,
    amount: body.amount,
    idempotencyKey: body.idempotencyKey,
    sensitiveOtp: body.otp,
    ...(body.reason ? { reason: body.reason } : {}),
    ...(body.confirmZeroNet ? { confirmZeroNet: true } : {}),
  };
}

type PayableAccount = Pick<BankAccount, "linkStatus" | "status" | "payable">;

/** The merchant portal pays out per Sub: BE refuses a Master account with 400 VALIDATION_ERROR. */
export function isSubMerchantAccount(account: BankAccount): account is BankAccount & { subMerchantId: string } {
  return Boolean(account.subMerchantId);
}

/** BE refuses a payout to an account that is not linked, is stopped or is not payable. */
export function isWithdrawableAccount(account: PayableAccount): boolean {
  return account.linkStatus === "LINKED"
    && account.status !== "INACTIVE"
    && account.payable !== false;
}

export function toBankOption(account: BankAccount & { subMerchantId: string }): WithdrawalBankOption {
  return {
    id: account.id,
    bankCode: account.bankCode,
    accountNumberMasked: account.accountNumber,
    accountName: account.accountName,
    isDefault: account.isDefault,
    subMerchantId: account.subMerchantId,
  };
}

type TitledWithdrawal = Pick<Withdrawal, "transactionCode" | "bankCode" | "bankAccountMasked">;

/** How a request is named in actions and dialogs: its code once issued, otherwise bank and masked number. */
export function withdrawalTitle(withdrawal: TitledWithdrawal): string {
  const bank = `${bankDisplayName(withdrawal.bankCode)} ${withdrawal.bankAccountMasked}`;
  return withdrawal.transactionCode ?? bank;
}
