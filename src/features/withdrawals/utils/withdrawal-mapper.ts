import type { BankAccount } from "@/features/bank-accounts/types";
import { bankDisplayName } from "@/features/bank-accounts/utils/bank-mapper";
import type { Withdrawal, WithdrawalCreateBody, WithdrawalStatus } from "../schemas/withdrawal.schema";
import type { WithdrawalBankOption } from "../types/types";

/** The portal only creates requests; a PENDING one still waits for the checker. */
export function isAwaitingApproval(status: WithdrawalStatus): boolean {
  return status === "PENDING";
}

/** BE reserves `amount + fee` from the wallet (grossAmount), so the fee is added, not deducted. */
export function withdrawalTotalDebit(withdrawal: Pick<Withdrawal, "amount" | "fee">): number | null {
  return withdrawal.fee === null ? null : withdrawal.amount + withdrawal.fee;
}

/** BE reads merchant, bank and account holder from the stored account, so only these four fields leave the browser. */
export function toWithdrawalCreateRequest(body: WithdrawalCreateBody) {
  return {
    bankAccountId: body.bankAccountId,
    amount: body.amount,
    idempotencyKey: body.idempotencyKey,
    ...(body.reason ? { reason: body.reason } : {}),
  };
}

type PayableAccount = Pick<BankAccount, "linkStatus" | "status" | "payable">;

/** Only a Master account can pay out for now: BE answers BANK_NOT_FOUND for a sub-merchant or terminal account. */
export function isMasterAccount(account: Pick<BankAccount, "level" | "subMerchantId">): boolean {
  return account.level === "MASTER" || !account.subMerchantId;
}

/** BE refuses a payout to an account that is not linked, is stopped or is not payable. */
export function isWithdrawableAccount(account: PayableAccount): boolean {
  return account.linkStatus === "LINKED"
    && account.status !== "INACTIVE"
    && account.payable !== false;
}

export function toBankOption(account: BankAccount): WithdrawalBankOption {
  return {
    id: account.id,
    bankCode: account.bankCode,
    accountNumberMasked: account.accountNumber,
    accountName: account.accountName,
    isDefault: account.isDefault,
    subMerchantId: account.subMerchantId ?? null,
  };
}

type TitledWithdrawal = Pick<Withdrawal, "transactionCode" | "bankCode" | "bankAccountMasked">;

/** How a request is named in actions and dialogs: its code once issued, otherwise bank and masked number. */
export function withdrawalTitle(withdrawal: TitledWithdrawal): string {
  const bank = `${bankDisplayName(withdrawal.bankCode)} ${withdrawal.bankAccountMasked}`;
  return withdrawal.transactionCode ?? bank;
}
