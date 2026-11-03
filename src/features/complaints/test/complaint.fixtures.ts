import type { Complaint } from "../types/types";

/** A complaint as `GET /api/v1/merchant/complaints/{id}` returns it (null fields omitted, as the BE does). */
export const BE_COMPLAINT: Complaint = {
  id: "11111111-1111-4111-8111-111111111111",
  complaintCode: "KN261103000001",
  transactionId: "33333333-3333-4333-8333-333333333333",
  transactionCode: "FM2611030001",
  subMerchantId: "44444444-4444-4444-8444-444444444444",
  subMerchantName: "Cửa hàng Quận 1",
  reporterType: "ADMIN",
  reporterName: "FlexPay",
  reasonCode: "AMOUNT_MISMATCH",
  content: "Khách báo bị trừ tiền hai lần",
  status: "PROCESSING",
  waitingOn: "MERCHANT",
  requestSource: "BANK",
  transactionAmount: 150000,
  transactionCreatedAt: "2026-11-01T02:00:00Z",
  deadlineAt: "2026-11-06T02:00:00Z",
  createdAt: "2026-11-03T02:00:00Z",
  updatedAt: "2026-11-03T03:00:00Z",
  messages: [
    {
      id: "55555555-5555-4555-8555-555555555555",
      authorType: "ADMIN",
      authorName: "FlexPay",
      content: "Vui lòng cung cấp sao kê",
      createdAt: "2026-11-03T03:00:00Z",
    },
  ],
  attachments: [
    { id: "66666666-6666-4666-8666-666666666666", fileName: "bien-lai.pdf", contentType: "application/pdf", sizeBytes: 2048 },
    {
      id: "77777777-7777-4777-8777-777777777777",
      fileName: "sao-ke.png",
      contentType: "image/png",
      sizeBytes: 4096,
      messageId: "55555555-5555-4555-8555-555555555555",
    },
  ],
};

/** The same complaint as a list row: the BE sends no messages or attachments in the list. */
export const BE_COMPLAINT_ROW: Complaint = (() => {
  const { messages: _messages, attachments: _attachments, ...row } = BE_COMPLAINT;
  void _messages;
  void _attachments;
  return row;
})();
