import { domainErrorMessage, type BeError } from "@/lib/be/errors";

/** The ledger being unreachable is the expected failure here, so it gets its own sentence instead of a generic one. */
export function subBalanceErrorMessage(error: BeError): string {
  if (error.status === 503) return "Chưa đọc được số dư từ sổ cái. Vui lòng thử lại sau ít phút.";
  if (error.status === 404) return "Không tìm thấy Sub-merchant này trong phạm vi của bạn.";
  return domainErrorMessage(error);
}
