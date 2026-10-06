import type {
  CardType,
  PaymentMethod,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@/features/transactions/types";

/**
 * Static sample data for development (MERCHANT_API_MODE=fixture). Nothing here is real:
 * names are placeholders, phones use the 0900000xxx range and card numbers are fully masked.
 */
const SUB_MERCHANTS = [
  { id: "SM001", name: "Cửa hàng mẫu A", bankCode: "VCB" },
  { id: "SM002", name: "Cửa hàng mẫu B", bankCode: "TCB" },
  { id: "SM003", name: "Cửa hàng mẫu C", bankCode: "MB" },
] as const;

const STATUSES: readonly TransactionStatus[] = [
  "success",
  "success",
  "pending",
  "success",
  "failed",
  "success",
  "refunded",
  "review",
  "cancelled",
  "created",
  "expired",
];
const TYPES: readonly TransactionType[] = ["payment", "refund", "top_up", "withdrawal", "payout", "settlement"];
const CARD_TYPES: readonly CardType[] = ["visa", "mastercard", "napas", "amex"];
const METHODS: readonly PaymentMethod[] = ["credit_card", "debit_card", "qr"];
const BASE_TIME = Date.UTC(2026, 8, 1, 3, 0, 0);
const HOUR_MS = 3_600_000;

const RESPONSES: Record<TransactionStatus, { code: string; message: string }> = {
  success: { code: "00", message: "Giao dịch thành công" },
  pending: { code: "09", message: "Giao dịch đang được xử lý" },
  failed: { code: "51", message: "Giao dịch không thành công" },
  refunded: { code: "00", message: "Giao dịch đã được hoàn tiền" },
  review: { code: "09", message: "Giao dịch chờ duyệt" },
  cancelled: { code: "12", message: "Giao dịch đã hủy" },
  created: { code: "01", message: "Giao dịch mới tạo" },
  expired: { code: "54", message: "Giao dịch hết hạn" },
};

function sampleTransaction(index: number): Transaction {
  const number = String(index + 1).padStart(3, "0");
  const subMerchant = SUB_MERCHANTS[index % SUB_MERCHANTS.length]!;
  const status = STATUSES[index % STATUSES.length]!;
  const amount = (index + 1) * 125_000;
  const fee = Math.round(amount * 0.011);
  return {
    id: `sample-trx-${number}`,
    code: `TRX-SAMPLE-${number}`,
    invoiceCode: `INV-SAMPLE-${number}`,
    type: TYPES[index % TYPES.length]!,
    cardType: CARD_TYPES[index % CARD_TYPES.length]!,
    cardNumber: `**** **** **** ${String(index + 1).padStart(4, "0")}`,
    cardHolderName: `CHU THE MAU ${number}`,
    amount,
    currency: "VND",
    fee,
    netAmount: amount - fee,
    subMerchantId: subMerchant.id,
    subMerchantName: subMerchant.name,
    customerId: `sample-customer-${number}`,
    customerName: `Khách hàng mẫu ${number}`,
    customerPhone: `0900000${number}`,
    createdAt: new Date(BASE_TIME + index * HOUR_MS * 7).toISOString(),
    status,
    description: `Thanh toán đơn hàng mẫu ${number}`,
    referenceCode: `REF-SAMPLE-${number}`,
    paymentMethod: METHODS[index % METHODS.length]!,
    bankCode: subMerchant.bankCode,
    responseCode: RESPONSES[status].code,
    responseMessage: RESPONSES[status].message,
  };
}

/** Newest first, like the list the BE will return. */
export const TRANSACTION_FIXTURES: readonly Transaction[] = Array.from({ length: 24 }, (_, index) =>
  sampleTransaction(index),
).reverse();
