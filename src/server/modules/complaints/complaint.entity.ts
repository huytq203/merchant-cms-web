"server-only";
import type { Complaint } from "@prisma/client";

export interface ComplaintResponse {
  id: string;
  ticketCode: string;
  transactionId: string | null;
  transactionCode: string | null;
  source: string;
  content: string;
  status: string;
  deadline: string | null;
  note: string | null;
  lastUpdatedAt: string | null;
  createdAt: string;
}

export function toComplaintResponse(complaint: Complaint): ComplaintResponse {
  return {
    id: complaint.id,
    ticketCode: complaint.ticketCode,
    transactionId: complaint.transactionId,
    transactionCode: complaint.transactionCode,
    source: complaint.source,
    content: complaint.content,
    status: complaint.status,
    deadline: complaint.deadline?.toISOString() ?? null,
    note: complaint.note,
    lastUpdatedAt: complaint.lastUpdatedAt?.toISOString() ?? null,
    createdAt: complaint.createdAt.toISOString(),
  };
}
