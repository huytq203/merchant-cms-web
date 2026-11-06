/** Codes the BFF puts on a failed cancel. After either, the order may already have been paid at the bank. */
export const ORDER_CANCEL_CODES = {
  notCancellable: "ORDER_NOT_CANCELLABLE",
  bankRejected: "BANK_CANCEL_REJECTED",
  bankUnavailable: "BANK_UNAVAILABLE",
} as const;

const UNCERTAIN: readonly string[] = [ORDER_CANCEL_CODES.bankRejected, ORDER_CANCEL_CODES.bankUnavailable];

/** True when the order was left ACTIVE but the customer may have paid it just now: reload before offering a retry. */
export function isCancelOutcomeUncertain(code: string | undefined): boolean {
  return code !== undefined && UNCERTAIN.includes(code);
}
