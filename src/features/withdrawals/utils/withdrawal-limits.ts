import { formatAmount } from "@/lib/utils/helper";
import type { WithdrawalBalance } from "../schemas/withdrawal.schema";

type Limits = Pick<WithdrawalBalance, "availableBalance" | "dailyLimitRemaining" | "minimumAmount" | "maximumAmount">;

/** The most one request can take now. The fee is added by BE on top, so the exact ceiling is a little lower. */
export function maxWithdrawable(balance: Limits): number {
  const ceilings = [balance.availableBalance, balance.dailyLimitRemaining, balance.maximumAmount]
    .filter((value): value is number => value !== null);
  return Math.min(...ceilings);
}

/** The first rule the amount breaks, in the words the merchant reads; BE still has the last word. */
export function amountProblem(amount: number, balance: Limits | undefined): string | null {
  if (!balance || !Number.isFinite(amount) || amount <= 0) return null;
  if (balance.minimumAmount !== null && amount < balance.minimumAmount) {
    return `Số tiền rút tối thiểu là ${formatAmount(balance.minimumAmount)}`;
  }
  if (balance.maximumAmount !== null && amount > balance.maximumAmount) {
    return `Số tiền rút tối đa mỗi lần là ${formatAmount(balance.maximumAmount)}`;
  }
  if (amount > balance.availableBalance) {
    return `Số tiền vượt số dư khả dụng ${formatAmount(balance.availableBalance)}`;
  }
  if (balance.dailyLimitRemaining !== null && amount > balance.dailyLimitRemaining) {
    return `Số tiền vượt hạn mức rút còn lại hôm nay ${formatAmount(balance.dailyLimitRemaining)}`;
  }
  return null;
}
