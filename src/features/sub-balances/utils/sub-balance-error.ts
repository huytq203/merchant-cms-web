import { domainErrorMessage, type BeError } from "@/lib/be/errors";

/** BE 5753 `MERCHANT_ESCROW_BALANCE_UNAVAILABLE` is a 503; a 5xx body loses its code here, so the status is matched as well. */
const isLedgerUnavailable = (error: BeError): boolean =>
  error.status === 503 || ["5753", "MERCHANT_ESCROW_BALANCE_UNAVAILABLE"].includes(error.code);

/** The ledger being unreachable is the expected failure here, so it gets its own sentence instead of a generic one. */
export function subBalanceErrorMessage(error: BeError): string {
  if (isLedgerUnavailable(error)) return "Chưa đọc được số dư từ sổ cái. Vui lòng thử lại sau ít phút.";
  if (error.status === 404) return "Không tìm thấy Sub-merchant này trong phạm vi của bạn.";
  return domainErrorMessage(error);
}
