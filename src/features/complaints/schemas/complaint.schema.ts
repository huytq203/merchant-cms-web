import { z } from "zod";

/**
 * Contract of `GET /api/v1/merchant/complaints` (flex.merchant `MerchantComplaintService.Complaint`).
 * The BE omits null fields (`@JsonInclude(NON_NULL)`), so every nullable field is `nullish`.
 * Times are ISO-8601 UTC instants.
 */
export const complaintStatusSchema = z.enum(["WAITING", "PROCESSING", "CLOSED", "CANCELLED"]);
/** Only set when the complaint is `CLOSED`. */
export const complaintVerdictSchema = z.enum(["ACCEPTED", "REJECTED"]);
/** Who a party is: reporter, author of a message, who the complaint waits on, who closed it. */
export const complaintPartySchema = z.enum(["ADMIN", "MERCHANT", "USER"]);
/** The seven reasons of `ComplaintReason` (decision 03/11/2026, Q2). */
export const complaintReasonSchema = z.enum([
  "NOT_RECEIVED",
  "FRAUD",
  "WRONG_FEE",
  "NOT_PROCESSED",
  "DUPLICATE",
  "AMOUNT_MISMATCH",
  "OTHER",
]);

/** Source of a request the gateway opened (tra soát); absent on a complaint the merchant created. */
export const complaintRequestSourceSchema = z.enum(["BANK", "AUTHORITY", "CARD_ORG", "INTERNAL"]);

export const complaintMessageSchema = z.object({
  id: z.string(),
  authorType: complaintPartySchema,
  authorName: z.string().nullish(),
  content: z.string(),
  createdAt: z.string(),
});

/** `messageId` null: the file was attached when the complaint was created. */
export const complaintAttachmentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  contentType: z.string().nullish(),
  sizeBytes: z.number(),
  messageId: z.string().nullish(),
});

export const complaintSchema = z.object({
  id: z.string(),
  complaintCode: z.string(),
  transactionId: z.string().nullish(),
  transactionCode: z.string().nullish(),
  subMerchantId: z.string().nullish(),
  subMerchantName: z.string().nullish(),
  reporterType: complaintPartySchema,
  reporterName: z.string().nullish(),
  /** Kept as a string: a code unknown to this build is shown as is rather than failing the whole list. */
  reasonCode: z.string().nullish(),
  content: z.string().nullish(),
  status: complaintStatusSchema,
  waitingOn: complaintPartySchema.nullish(),
  verdict: complaintVerdictSchema.nullish(),
  verdictContent: z.string().nullish(),
  closedByParty: complaintPartySchema.nullish(),
  deadlineAt: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string().nullish(),
  closedAt: z.string().nullish(),
  /** Who asked the gateway to open the case; null when the merchant created the complaint itself. */
  requestSource: complaintRequestSourceSchema.nullish(),
  /** Amount of the complained transaction, VND. */
  transactionAmount: z.number().nullish(),
  transactionCreatedAt: z.string().nullish(),
  /** Only the detail carries messages and attachments; list rows leave them out. */
  messages: z.array(complaintMessageSchema).nullish(),
  attachments: z.array(complaintAttachmentSchema).nullish(),
});

export const complaintListResultSchema = z.object({
  rows: z.array(complaintSchema),
  total: z.number().int().min(0),
});

/** `DocumentReadLinkIssuer.Issued`: a read link valid for five minutes. */
export const attachmentLinkSchema = z.object({
  url: z.string(),
  ttlSeconds: z.number().nullish(),
  expiresAt: z.string().nullish(),
});

export const attachmentUploadSchema = z.object({ attachmentId: z.string() });

/** `GET /complaints/transaction-check`: the order the typed code belongs to (merchant scope already applied by the BE). */
/**
 * Đơn tìm được từ MỘT mã (mã giao dịch FM… hoặc mã đơn hàng). Các trường sau `createdAt` do BE thêm ở tối ưu Portal
 * 10/11/2026 nên nullish: thẻ xác nhận chỉ hiện phần có dữ liệu.
 */
export const transactionCheckSchema = z.object({
  transactionId: z.string(),
  transactionCode: z.string(),
  orderCode: z.string().nullish(),
  subMerchantName: z.string().nullish(),
  terminalCode: z.string().nullish(),
  amount: z.number().nullish(),
  status: z.string(),
  createdAt: z.string().nullish(),
  paidAt: z.string().nullish(),
});

export const MAX_COMPLAINT_ATTACHMENTS = 10;
export const MAX_CREATE_CONTENT = 2000;
export const MAX_REPLY_CONTENT = 1000;
export const MAX_REJECT_REASON = 2000;

const attachmentIdsSchema = z
  .array(z.uuid())
  .max(MAX_COMPLAINT_ATTACHMENTS, `Chỉ được đính kèm tối đa ${MAX_COMPLAINT_ATTACHMENTS} tệp mỗi lần gửi`)
  .default([]);

/** Body of `POST /complaints`, checked by the route before it is forwarded; the BE checks again. */
export const createComplaintBodySchema = z.object({
  transactionCode: z.string().trim().min(1, "Vui lòng nhập mã giao dịch hoặc mã đơn hàng").max(100, "Mã giao dịch hoặc mã đơn hàng không hợp lệ"),
  reasonCode: complaintReasonSchema,
  content: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập nội dung khiếu nại")
    .max(MAX_CREATE_CONTENT, `Nội dung khiếu nại không được vượt quá ${MAX_CREATE_CONTENT} ký tự`),
  attachmentIds: attachmentIdsSchema,
});

/** Body of `POST /complaints/{id}/replies`. */
export const replyComplaintBodySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập nội dung phản hồi")
    .max(MAX_REPLY_CONTENT, `Nội dung phản hồi không được vượt quá ${MAX_REPLY_CONTENT} ký tự`),
  attachmentIds: attachmentIdsSchema,
});

/** Body of `POST /complaints/{id}/reject`: the reason is mandatory. */
export const rejectComplaintBodySchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập lý do từ chối")
    .max(MAX_REJECT_REASON, `Lý do từ chối không được vượt quá ${MAX_REJECT_REASON} ký tự`),
});

/**
 * Query of the list route and of the page URL: the BE filters. Dates are calendar days (`yyyy-MM-dd`,
 * Vietnam time); the BE includes the whole last day. Pages start at 1, at most 100 rows.
 */
export const complaintListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    keyword: z.string().trim().max(100).optional(),
    status: complaintStatusSchema.optional(),
    waitingOn: complaintPartySchema.optional(),
    reporterType: complaintPartySchema.optional(),
    subMerchantId: z.uuid().optional(),
    createdFrom: z.iso.date().optional(),
    createdTo: z.iso.date().optional(),
  })
  .refine(({ createdFrom, createdTo }) => !createdFrom || !createdTo || createdFrom <= createdTo, {
    message: "Ngày bắt đầu phải trước ngày kết thúc",
    path: ["createdTo"],
  });

/** Filter form values; dates stay `Date` until they are written to the URL. */
export const complaintFilterSchema = z
  .object({
    keyword: z.string().max(100).optional(),
    status: z.string().optional(),
    waitingOn: z.string().optional(),
    reporterType: z.string().optional(),
    subMerchantId: z.string().optional(),
    createdFrom: z.date().nullable().optional(),
    createdTo: z.date().nullable().optional(),
  })
  .refine(({ createdFrom, createdTo }) => !createdFrom || !createdTo || createdFrom <= createdTo, {
    message: "Ngày bắt đầu phải nhỏ hơn ngày kết thúc",
    path: ["createdTo"],
  });

export type ComplaintFilterValues = z.infer<typeof complaintFilterSchema>;
