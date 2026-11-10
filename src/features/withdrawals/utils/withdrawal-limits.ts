import { formatAmount } from "@/lib/utils/helper";
import type { WithdrawalBalance } from "../schemas/withdrawal.schema";

type Limits = Pick<
  WithdrawalBalance,
  "readyAmount" | "dailyLimitRemaining" | "dailyCountRemaining" | "minimumAmount" | "maximumAmount"
> & Partial<Pick<WithdrawalBalance, "automaticSettlement" | "blocker" | "blockerMessage" | "netReceived">>;

/** BE `FEE_EXCEEDS_REMAINDER`: after the escrow setoff, what is left cannot pay the withdrawal fee; BE refuses the request. */
export const FEE_EXCEEDS_REMAINDER_BLOCKER = "Số tiền còn lại sau cấn trừ ký quỹ không đủ trả phí rút";

/** Why a Sub in automatic settlement mode has no manual request; BE would refuse it with 5782. */
export const AUTOMATIC_SETTLEMENT_BLOCKER =
  "Điểm bán đang rút tự động theo chu kỳ: hệ thống tự tạo lệnh rút, không cần tạo lệnh rút thủ công.";

/**
 * Why the payout is zero, said on the review step next to the zero-net confirmation. When the escrow setoff takes the
 * whole amount, say so and what is still missing (it is set off on the next withdrawal); otherwise the fee took what
 * the setoff left.
 */
export function zeroNetExplanation(statement: { readyAmount: number; setoff: number; escrowShortfallAfter?: number | null }): string {
  if (statement.setoff > 0 && statement.setoff >= statement.readyAmount) {
    const carried = statement.escrowShortfallAfter ?? 0;
    return [
      `Toàn bộ ${formatAmount(statement.readyAmount)} dùng để bù ký quỹ.`,
      "Không có tiền chuyển về tài khoản.",
      carried > 0 ? `Ký quỹ còn thiếu ${formatAmount(carried)} sẽ được cấn ở lần rút sau.` : null,
    ].filter(Boolean).join(" ");
  }
  return "Số tiền thực nhận bằng 0: toàn bộ khoản rút bị cấn trừ hoặc dùng để trả phí, bạn sẽ không nhận được tiền về tài khoản.";
}

/**
 * The first reason the amount BE will carry (`readyAmount`) cannot be sent, in the words the merchant reads.
 * The amount is not editable, so this blocks the request instead of marking a field; BE still has the last word.
 */
export function withdrawalBlocker(balance: Limits | undefined): string | null {
  if (!balance) return null;
  // Checked first: no amount rule matters when manual requests are not accepted at all.
  if (balance.automaticSettlement) return AUTOMATIC_SETTLEMENT_BLOCKER;
  const { readyAmount } = balance;
  if (readyAmount <= 0) return "Chưa có khoản nào sẵn sàng để rút";
  // BE says up front that it would refuse the request (setoff leaves too little for the fee). An older BE that does not
  // send `blocker` shows the same case as a negative net. A net of exactly 0 is not blocked: it is confirmed on step 2.
  if (balance.blocker) return balance.blockerMessage || FEE_EXCEEDS_REMAINDER_BLOCKER;
  if (typeof balance.netReceived === "number" && balance.netReceived < 0) return FEE_EXCEEDS_REMAINDER_BLOCKER;
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
