import type { z } from "zod";
import type {
  attachmentLinkSchema,
  complaintAttachmentSchema,
  complaintListQuerySchema,
  complaintListResultSchema,
  complaintMessageSchema,
  complaintPartySchema,
  complaintReasonSchema,
  complaintRequestSourceSchema,
  complaintSchema,
  complaintStatusSchema,
  complaintVerdictSchema,
  createComplaintBodySchema,
  rejectComplaintBodySchema,
  replyComplaintBodySchema,
  transactionCheckSchema,
} from "../schemas/complaint.schema";

export type ComplaintStatus = z.infer<typeof complaintStatusSchema>;
export type ComplaintVerdict = z.infer<typeof complaintVerdictSchema>;
export type ComplaintParty = z.infer<typeof complaintPartySchema>;
export type ComplaintReason = z.infer<typeof complaintReasonSchema>;
export type ComplaintRequestSource = z.infer<typeof complaintRequestSourceSchema>;
export type Complaint =z.infer<typeof complaintSchema>;
export type ComplaintMessage = z.infer<typeof complaintMessageSchema>;
export type ComplaintAttachment = z.infer<typeof complaintAttachmentSchema>;
export type ComplaintListResult = z.infer<typeof complaintListResultSchema>;
export type ComplaintListFilter = z.infer<typeof complaintListQuerySchema>;
export type AttachmentLink = z.infer<typeof attachmentLinkSchema>;
export type TransactionCheck = z.infer<typeof transactionCheckSchema>;
export type CreateComplaintBody = z.input<typeof createComplaintBodySchema>;
export type ReplyComplaintBody = z.input<typeof replyComplaintBodySchema>;
export type RejectComplaintBody = z.infer<typeof rejectComplaintBodySchema>;
