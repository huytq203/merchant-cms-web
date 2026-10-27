import { formatAmount } from "@/lib/utils/helper";
import type { WithdrawalBalance } from "../schemas/withdrawal.schema";

type Limits = Pick<
  WithdrawalBalance,
  "readyAmount" | "dailyLimitRemaining" | "dailyCountRemaining" | "minimumAmount" | "maximumAmount"
>;

/**
 * The first reason the amount BE will carry (`readyAmount`) cannot be sent, in the words the merchant reads.
 * The amount is not editable, so this blocks the request instead of marking a field; BE still has the last word.
 */
export function withdrawalBlocker(balance: Limits | undefined): string | null {
  if (!balance) return null;
  const { readyAmount } = balance;
  if (readyAmount <= 0) return "Chưa có khoản nào sẵn sàng để rút";
  if (balance.dailyCountRemaining !== null && balance.dailyCountRemaining <= 0) {
    return "Đã hết số lần rút trong ngày";
  }
  if (balance.minimumAmount !== null && readyAmount < balance.minimumAmount) {
    return `Số tiền sẵn sàng rút thấp hơn mức tối thiểu ${formatAmount(balance.minimumAmount)}`;
  }
  if (balance.maximumAmount !== null && readyAmount > balance.maximumAmount) {
    return `Số tiền sẵn sàng rút vượt mức tối đa mỗi lần ${formatAmount(balance.maximumAmount)}`;
  }
  if (balance.dailyLimitRemaining !== null && readyAmount > balance.dailyLimitRemaining) {
    return `Số tiền sẵn sàng rút vượt hạn mức rút còn lại hôm nay ${formatAmount(balance.dailyLimitRemaining)}`;
  }
  return null;
}
