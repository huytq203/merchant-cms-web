import type {
  Complaint,
  ComplaintMessage,
  ComplaintSource,
  ComplaintStatus,
} from "@/features/complaints/types/types";

/**
 * Static sample data for development (MERCHANT_API_MODE=fixture). Nothing here is real:
 * the wording is generic and no name, contact or account number appears.
 */
const STATUSES: readonly ComplaintStatus[] = ["pending", "processing", "resolved", "rejected", "processing"];
const SOURCES: readonly ComplaintSource[] = ["customer", "gateway", "merchant"];
const CONTENTS: readonly string[] = [
  "Khách hàng báo đã bị trừ tiền nhưng đơn hàng chưa được xác nhận (nội dung mẫu).",
  "Cổng yêu cầu đối soát giao dịch có số tiền chênh lệch (nội dung mẫu).",
  "Merchant đề nghị tra soát giao dịch thanh toán không thành công (nội dung mẫu).",
  "Khách hàng báo giao dịch bị tính phí hai lần (nội dung mẫu).",
];
const REASONS = ["Khách báo chưa nhận hàng", "Nghi ngờ gian lận", "Sai lệch số tiền", "Khác"] as const;
const SUB_MERCHANTS = ["Đơn vị mẫu 01", "Đơn vị mẫu 02", "Đơn vị mẫu 03"] as const;
const NOTES: readonly (string | null)[] = [null, "Đang chờ bổ sung chứng từ", null];
const BASE_TIME = Date.UTC(2026, 8, 2, 1, 30, 0);
const DAY_MS = 86_400_000;

const SAMPLE_THREAD: readonly ComplaintMessage[] = [
  {
    id: "m-1",
    role: "admin",
    senderName: "Cổng Thanh Toán (mẫu)",
    content: "Vui lòng kiểm tra lại giao dịch và cung cấp chứng từ liên quan (nội dung mẫu).",
    time: "2026-09-12T09:00:00.000Z",
  },
  {
    id: "m-2",
    role: "merchant",
    senderName: "Merchant (mẫu)",
    content: "Chúng tôi đang kiểm tra và sẽ phản hồi sớm (nội dung mẫu).",
    time: "2026-09-12T09:15:00.000Z",
  },
];

function sampleComplaint(index: number): Complaint {
  const number = String(index + 1).padStart(3, "0");
  const status = STATUSES[index % STATUSES.length]!;
  const createdAt = BASE_TIME + index * DAY_MS;
  const hasTransaction = index % 4 !== 3;
  return {
    id: `sample-complaint-${number}`,
    ticketCode: `TRS-SAMPLE-${number}`,
    transactionId: hasTransaction ? `sample-trx-${number}` : null,
    transactionCode: hasTransaction ? `TRX-SAMPLE-${number}` : null,
    subMerchantName: SUB_MERCHANTS[index % SUB_MERCHANTS.length]!,
    reason: REASONS[index % REASONS.length]!,
    source: SOURCES[index % SOURCES.length]!,
    content: CONTENTS[index % CONTENTS.length]!,
    status,
    // Past deadlines show the overdue marker; the others stay in the future.
    deadline: new Date(index % 2 === 0 ? createdAt + 3 * DAY_MS : Date.UTC(2030, 0, 1)).toISOString(),
    note: NOTES[index % NOTES.length]!,
    lastUpdatedAt: status === "pending" ? null : new Date(createdAt + DAY_MS / 2).toISOString(),
    createdAt: new Date(createdAt).toISOString(),
    messages: status === "processing" ? [...SAMPLE_THREAD] : [],
  };
}

/** Newest first, like the list the BE will return. */
export const COMPLAINT_FIXTURES: readonly Complaint[] = Array.from({ length: 10 }, (_, index) =>
  sampleComplaint(index),
).reverse();
