import type { z } from "zod";
import type {
  complaintListQuerySchema,
  complaintListResultSchema,
  complaintMessageSchema,
  complaintSchema,
  complaintSourceSchema,
  complaintStatusSchema,
} from "../schemas/complaint.schema";

export type ComplaintStatus = z.infer<typeof complaintStatusSchema>;
export type ComplaintSource = z.infer<typeof complaintSourceSchema>;
export type Complaint = z.infer<typeof complaintSchema>;
export type ComplaintMessage = z.infer<typeof complaintMessageSchema>;
export type ComplaintListResult = z.infer<typeof complaintListResultSchema>;
export type ComplaintListFilter = z.infer<typeof complaintListQuerySchema>;
